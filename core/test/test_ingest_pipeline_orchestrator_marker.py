import os
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.ai_engine.ingest import process_document


class _FakeVectorStore:
    def __init__(self):
        self.texts = []
        self.metadatas = []

    def add_texts(self, texts, metadatas):
        self.texts.extend(list(texts or []))
        self.metadatas.extend(list(metadatas or []))
        return []


class _FakePdfPage:
    def __init__(self, text="legacy pdf text"):
        self._text = text

    def extract_text(self):
        return self._text

    def extract_tables(self):
        return []


class _FakePdf:
    def __init__(self, pages):
        self.pages = pages

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class MarkerOrchestratorIntegrationTests(TestCase):
    def _mk_doc(self, path: str, title: str, doc_id: int = 77, user_id: int = 11):
        return SimpleNamespace(
            id=doc_id,
            title=title,
            file=SimpleNamespace(path=path),
            user=SimpleNamespace(id=user_id),
        )

    @patch("core.ai_engine.ingest.get_vectorstore")
    @patch("core.ai_engine.ingest._marker_supports_extension", return_value=True)
    @patch("core.ai_engine.ingest._extract_with_marker")
    def test_marker_success_docx_writes_metadata_as_marker(
        self,
        marker_extract_mock,
        _marker_supported_mock,
        get_vs_mock,
    ):
        marker_extract_mock.return_value = {
            "ok": True,
            "text_content": "hasil marker docx",
            "page_payload": [{"page": 1, "raw_text": "hasil marker docx", "rough_table_text": ""}],
            "detected_columns": ["Hari", "Jam"],
            "stats": {"extractor": "marker", "source_ext": "docx", "marker_ms": 25, "fallback_reason": ""},
            "error": None,
        }

        fake_vs = _FakeVectorStore()
        get_vs_mock.return_value = fake_vs

        with TemporaryDirectory() as tmp, patch.dict(
            "os.environ",
            {
                "RAG_INGEST_MARKER_ENABLED": "1",
                "RAG_INGEST_MARKER_FALLBACK_ENABLED": "1",
                "RAG_INGEST_MARKER_TRAFFIC_PCT": "100",
            },
            clear=False,
        ):
            p = Path(tmp) / "sample.docx"
            p.write_bytes(b"docx-content")
            doc = self._mk_doc(str(p), "sample.docx")

            ok = process_document(doc)

        self.assertTrue(ok)
        self.assertTrue(fake_vs.metadatas)
        meta = fake_vs.metadatas[0]
        self.assertEqual(meta.get("extractor"), "marker")
        self.assertEqual(meta.get("ingest_engine"), "marker")

    @patch("core.ai_engine.ingest.get_vectorstore")
    @patch("core.ai_engine.ingest.pdfplumber.open")
    @patch("core.ai_engine.ingest._extract_pdf_tables")
    @patch("core.ai_engine.ingest._marker_supports_extension", return_value=True)
    @patch("core.ai_engine.ingest._extract_with_marker")
    def test_marker_fail_pdf_with_fallback_on_uses_legacy_flow(
        self,
        marker_extract_mock,
        _marker_supported_mock,
        extract_tables_mock,
        pdf_open_mock,
        get_vs_mock,
    ):
        marker_extract_mock.return_value = {
            "ok": False,
            "text_content": "",
            "page_payload": [],
            "detected_columns": [],
            "stats": {"extractor": "marker", "source_ext": "pdf", "marker_ms": 13, "fallback_reason": "marker_error"},
            "error": "marker_error",
        }

        fake_vs = _FakeVectorStore()
        get_vs_mock.return_value = fake_vs
        pdf_open_mock.return_value = _FakePdf([_FakePdfPage("teks legacy")])
        extract_tables_mock.return_value = ("", [], [])

        with TemporaryDirectory() as tmp, patch.dict(
            "os.environ",
            {
                "RAG_INGEST_MARKER_ENABLED": "1",
                "RAG_INGEST_MARKER_FALLBACK_ENABLED": "1",
                "RAG_INGEST_MARKER_TRAFFIC_PCT": "100",
            },
            clear=False,
        ):
            p = Path(tmp) / "legacy.pdf"
            p.write_bytes(b"%PDF-1.4")
            doc = self._mk_doc(str(p), "legacy.pdf")
            ok = process_document(doc)

        self.assertTrue(ok)
        self.assertTrue(fake_vs.metadatas)
        meta = fake_vs.metadatas[0]
        self.assertEqual(meta.get("extractor"), "legacy")
        self.assertEqual(meta.get("ingest_fallback"), "on")

    @patch("core.ai_engine.ingest._marker_supports_extension", return_value=True)
    @patch("core.ai_engine.ingest._extract_with_marker")
    def test_marker_fail_with_fallback_off_returns_false(
        self,
        marker_extract_mock,
        _marker_supported_mock,
    ):
        marker_extract_mock.return_value = {
            "ok": False,
            "text_content": "",
            "page_payload": [],
            "detected_columns": [],
            "stats": {"extractor": "marker", "source_ext": "pdf", "marker_ms": 10, "fallback_reason": "marker_error"},
            "error": "marker_error",
        }

        with TemporaryDirectory() as tmp, patch.dict(
            "os.environ",
            {
                "RAG_INGEST_MARKER_ENABLED": "1",
                "RAG_INGEST_MARKER_FALLBACK_ENABLED": "0",
                "RAG_INGEST_MARKER_TRAFFIC_PCT": "100",
            },
            clear=False,
        ):
            p = Path(tmp) / "must_fail.pdf"
            p.write_bytes(b"%PDF-1.4")
            doc = self._mk_doc(str(p), "must_fail.pdf")
            ok = process_document(doc)

        self.assertFalse(ok)

    @patch("core.ai_engine.ingest.get_vectorstore")
    @patch("core.ai_engine.ingest._marker_supports_extension", return_value=True)
    @patch("core.ai_engine.ingest._extract_with_marker")
    @patch("core.ai_engine.ingest_pipeline.orchestrator.extract_excel_markdown", side_effect=AssertionError("legacy excel extractor should not be called"))
    def test_xlsx_uses_marker_not_legacy_excel_extractor(
        self,
        _legacy_excel_mock,
        marker_extract_mock,
        _marker_supported_mock,
        get_vs_mock,
    ):
        marker_extract_mock.return_value = {
            "ok": True,
            "text_content": "xlsx via marker",
            "page_payload": [{"page": 1, "raw_text": "xlsx via marker", "rough_table_text": ""}],
            "detected_columns": ["col1", "col2"],
            "stats": {"extractor": "marker", "source_ext": "xlsx", "marker_ms": 21, "fallback_reason": ""},
            "error": None,
        }
        fake_vs = _FakeVectorStore()
        get_vs_mock.return_value = fake_vs

        with TemporaryDirectory() as tmp, patch.dict(
            "os.environ",
            {
                "RAG_INGEST_MARKER_ENABLED": "1",
                "RAG_INGEST_MARKER_FALLBACK_ENABLED": "1",
                "RAG_INGEST_MARKER_TRAFFIC_PCT": "100",
            },
            clear=False,
        ):
            p = Path(tmp) / "sheet.xlsx"
            p.write_bytes(b"xlsx")
            doc = self._mk_doc(str(p), "sheet.xlsx")
            ok = process_document(doc)

        self.assertTrue(ok)
        self.assertTrue(fake_vs.metadatas)
        self.assertEqual(fake_vs.metadatas[0].get("extractor"), "marker")

    @patch("core.ai_engine.ingest.get_vectorstore")
    @patch("core.ai_engine.ingest._extract_with_marker")
    @patch("core.ai_engine.ingest_pipeline.orchestrator.extract_csv_markdown")
    def test_marker_disabled_keeps_legacy_csv_flow(
        self,
        csv_extract_mock,
        marker_extract_mock,
        get_vs_mock,
    ):
        csv_extract_mock.return_value = {
            "text_content": "| a | b |\n|---|---|\n|1|2|",
            "detected_columns": ["a", "b"],
            "rows_count": 1,
        }
        fake_vs = _FakeVectorStore()
        get_vs_mock.return_value = fake_vs

        with TemporaryDirectory() as tmp, patch.dict(
            "os.environ",
            {
                "RAG_INGEST_MARKER_ENABLED": "0",
                "RAG_INGEST_MARKER_FALLBACK_ENABLED": "1",
                "RAG_INGEST_MARKER_TRAFFIC_PCT": "100",
            },
            clear=False,
        ):
            p = Path(tmp) / "data.csv"
            p.write_text("a,b\n1,2\n", encoding="utf-8")
            doc = self._mk_doc(str(p), "data.csv")
            ok = process_document(doc)

        self.assertTrue(ok)
        marker_extract_mock.assert_not_called()
        csv_extract_mock.assert_called_once()
