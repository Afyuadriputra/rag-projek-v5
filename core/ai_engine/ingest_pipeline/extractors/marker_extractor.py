import os
import re
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd


_DEFAULT_MARKER_EXTS = {
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "html",
    "htm",
    "epub",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "webp",
    "csv",
}

_PAGE_BREAK_RE = re.compile(r"\n\n(\d+)\n-{10,}\n\n")
_TABLE_SEP_RE = re.compile(r"\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|")


def _env_bool(name: str, default: bool = False) -> bool:
    raw = str(os.environ.get(name, "1" if default else "0")).strip().lower()
    return raw in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    try:
        return int(str(os.environ.get(name, str(default))).strip())
    except Exception:
        return int(default)


def _env_str(name: str, default: str = "") -> str:
    return str(os.environ.get(name, default))


def _normalize_ext(ext: str) -> str:
    return str(ext or "").strip().lower().lstrip(".")


def _allowed_exts() -> set[str]:
    raw = _env_str(
        "RAG_INGEST_MARKER_ALLOWED_EXTS",
        "pdf,docx,doc,pptx,ppt,xlsx,xls,html,htm,epub,png,jpg,jpeg,gif,bmp,webp,csv",
    )
    parsed = {x.strip().lower().lstrip(".") for x in raw.split(",") if x.strip()}
    return parsed or set(_DEFAULT_MARKER_EXTS)


def supports_extension(ext: str) -> bool:
    ext_n = _normalize_ext(ext)
    return ext_n in _DEFAULT_MARKER_EXTS and ext_n in _allowed_exts()


def convert_csv_to_temp_xlsx(csv_path: str) -> str:
    try:
        df = pd.read_csv(csv_path)
    except Exception:
        try:
            df = pd.read_csv(csv_path, sep=";")
        except Exception:
            df = pd.read_csv(csv_path, sep=None, engine="python", encoding="latin-1")

    tmp = tempfile.NamedTemporaryFile(prefix="marker_csv_", suffix=".xlsx", delete=False)
    tmp.close()
    out_path = tmp.name
    df.to_excel(out_path, index=False)
    return out_path


def _markdown_table_blocks(text: str) -> str:
    lines = str(text or "").splitlines()
    blocks: List[str] = []
    run: List[str] = []

    def flush() -> None:
        nonlocal run
        if len(run) >= 2 and any(_TABLE_SEP_RE.search(x or "") for x in run):
            blocks.append("\n".join(run).strip())
        run = []

    for line in lines:
        if "|" in line:
            run.append(line)
        else:
            flush()
    flush()
    return "\n\n".join([b for b in blocks if b]).strip()


def _extract_columns_from_markdown(markdown_text: str) -> List[str]:
    lines = str(markdown_text or "").splitlines()
    out: List[str] = []
    seen = set()

    for idx in range(len(lines) - 1):
        head = str(lines[idx] or "")
        sep = str(lines[idx + 1] or "")
        if "|" not in head:
            continue
        if not _TABLE_SEP_RE.search(sep):
            continue

        cells = [c.strip() for c in head.strip().strip("|").split("|")]
        for cell in cells:
            if not cell:
                continue
            norm = cell.strip().lower()
            if norm in seen:
                continue
            seen.add(norm)
            out.append(cell.strip())
    return out


def _split_paginated_markdown(markdown_text: str) -> List[Dict[str, Any]]:
    text = str(markdown_text or "").strip()
    if not text:
        return []

    if not _PAGE_BREAK_RE.search(text):
        return [
            {
                "page": 1,
                "raw_text": text,
                "rough_table_text": _markdown_table_blocks(text),
            }
        ]

    parts = _PAGE_BREAK_RE.split(text)
    out: List[Dict[str, Any]] = []

    prefix = str(parts[0] or "").strip()
    if prefix:
        out.append({"page": 1, "raw_text": prefix, "rough_table_text": _markdown_table_blocks(prefix)})

    i = 1
    while i + 1 < len(parts):
        try:
            page_num = int(str(parts[i] or "").strip())
        except Exception:
            page_num = len(out) + 1
        payload = str(parts[i + 1] or "").strip()
        if payload:
            out.append(
                {
                    "page": page_num,
                    "raw_text": payload,
                    "rough_table_text": _markdown_table_blocks(payload),
                }
            )
        i += 2

    return out


def _rendered_to_markdown(rendered: Any) -> str:
    if rendered is None:
        return ""
    if isinstance(rendered, str):
        return rendered

    markdown = str(getattr(rendered, "markdown", "") or "").strip()
    if markdown:
        return markdown

    try:
        from marker.output import text_from_rendered  # type: ignore

        text, _, _images = text_from_rendered(rendered)
        return str(text or "").strip()
    except Exception:
        return ""


@lru_cache(maxsize=1)
def _get_marker_converter() -> Any:
    from marker.config.parser import ConfigParser  # type: ignore
    from marker.converters.pdf import PdfConverter  # type: ignore
    from marker.models import create_model_dict  # type: ignore

    cfg = {
        "output_format": _env_str("RAG_INGEST_MARKER_OUTPUT_FORMAT", "markdown") or "markdown",
        "paginate_output": _env_bool("RAG_INGEST_MARKER_PAGINATE_OUTPUT", True),
        "use_llm": _env_bool("RAG_INGEST_MARKER_USE_LLM", False),
        "force_ocr": _env_bool("RAG_INGEST_MARKER_FORCE_OCR", False),
        "disable_image_extraction": _env_bool("RAG_INGEST_MARKER_DISABLE_IMAGE_EXTRACTION", True),
    }

    parser = ConfigParser(cfg)
    converter = PdfConverter(
        config=parser.generate_config_dict(),
        artifact_dict=create_model_dict(),
        processor_list=parser.get_processors(),
        renderer=parser.get_renderer(),
        llm_service=parser.get_llm_service(),
    )
    return converter


def _run_marker(path: str) -> str:
    converter = _get_marker_converter()
    rendered = converter(path)
    return _rendered_to_markdown(rendered)


def extract_with_marker(file_path: str, *, ext: str) -> Dict[str, Any]:
    ext_n = _normalize_ext(ext)
    start = time.perf_counter()
    timeout_sec = max(5, _env_int("RAG_INGEST_MARKER_TIMEOUT_SEC", 180))

    actual_path = str(file_path)
    cleanup_paths: List[str] = []

    try:
        if ext_n == "csv":
            actual_path = convert_csv_to_temp_xlsx(str(file_path))
            cleanup_paths.append(actual_path)

        with ThreadPoolExecutor(max_workers=1) as pool:
            fut = pool.submit(_run_marker, actual_path)
            try:
                markdown = str(fut.result(timeout=timeout_sec) or "").strip()
            except FutureTimeoutError:
                fut.cancel()
                raise TimeoutError(f"marker_timeout:{timeout_sec}s")

        if not markdown:
            raise RuntimeError("marker_empty_output")

        page_payload = _split_paginated_markdown(markdown)
        detected_columns = _extract_columns_from_markdown(markdown)
        marker_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": True,
            "text_content": markdown,
            "page_payload": page_payload,
            "detected_columns": detected_columns,
            "stats": {
                "extractor": "marker",
                "source_ext": ext_n,
                "marker_ms": marker_ms,
                "fallback_reason": "",
            },
            "error": None,
        }
    except Exception as e:
        marker_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": False,
            "text_content": "",
            "page_payload": [],
            "detected_columns": [],
            "stats": {
                "extractor": "marker",
                "source_ext": ext_n,
                "marker_ms": marker_ms,
                "fallback_reason": str(e),
            },
            "error": str(e),
        }
    finally:
        for p in cleanup_paths:
            try:
                Path(p).unlink(missing_ok=True)
            except Exception:
                pass
