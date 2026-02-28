from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from core.ai_engine.ingest_pipeline.extractors import marker_extractor


class MarkerExtractorTests(TestCase):
    def test_supports_extension_matrix(self):
        self.assertTrue(marker_extractor.supports_extension("pdf"))
        self.assertTrue(marker_extractor.supports_extension("docx"))
        self.assertTrue(marker_extractor.supports_extension("xlsx"))
        self.assertTrue(marker_extractor.supports_extension("csv"))
        self.assertFalse(marker_extractor.supports_extension("txt"))

    def test_convert_csv_to_temp_xlsx_creates_file(self):
        with TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "sample.csv"
            csv_path.write_text("col_a,col_b\n1,2\n", encoding="utf-8")

            out_path = marker_extractor.convert_csv_to_temp_xlsx(str(csv_path))
            out_file = Path(out_path)
            try:
                self.assertTrue(out_file.exists())
                self.assertEqual(out_file.suffix.lower(), ".xlsx")
            finally:
                out_file.unlink(missing_ok=True)

    def test_extract_with_marker_builds_page_payload_and_columns(self):
        markdown = (
            "Pembuka dokumen\n\n"
            "1\n"
            "------------------------------------------------\n\n"
            "| Hari | Jam |\n"
            "| --- | --- |\n"
            "| Senin | 07:00-08:40 |\n\n"
            "Isi halaman satu\n\n"
            "2\n"
            "------------------------------------------------\n\n"
            "Isi halaman dua\n"
        )

        with patch("core.ai_engine.ingest_pipeline.extractors.marker_extractor._run_marker", return_value=markdown):
            result = marker_extractor.extract_with_marker("/tmp/doc.pdf", ext="pdf")

        self.assertTrue(result.get("ok"))
        self.assertEqual(result.get("error"), None)
        self.assertGreaterEqual(len(result.get("page_payload") or []), 2)
        self.assertIn("Hari", result.get("detected_columns") or [])
        self.assertIn("Jam", result.get("detected_columns") or [])

    def test_extract_with_marker_csv_uses_temp_xlsx_conversion(self):
        with patch(
            "core.ai_engine.ingest_pipeline.extractors.marker_extractor.convert_csv_to_temp_xlsx",
            return_value="/tmp/converted.xlsx",
        ) as convert_mock, patch(
            "core.ai_engine.ingest_pipeline.extractors.marker_extractor._run_marker",
            return_value="hasil marker",
        ) as run_mock:
            result = marker_extractor.extract_with_marker("/tmp/source.csv", ext="csv")

        self.assertTrue(result.get("ok"))
        convert_mock.assert_called_once_with("/tmp/source.csv")
        run_mock.assert_called_once_with("/tmp/converted.xlsx")
