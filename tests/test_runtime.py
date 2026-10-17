"""Package and entry-point checks that do not call a provider or database."""

import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from importlib.resources import files
from unittest.mock import patch

from workweave import config
from workweave.paths import PROJECT_ROOT


class RuntimeTests(unittest.TestCase):
    def test_packaged_fixture_has_required_sections(self):
        data = json.loads((files("workweave") / "data/company-sources.json").read_text())
        self.assertTrue(data["services"])
        self.assertTrue(data["experiment"])

    def test_config_loads_from_project_root_and_keeps_process_priority(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / ".env").write_text(
                "PORT=9999\nOPENAI_API_KEY=synthetic-value\nUNKNOWN_SETTING=ignored\n"
            )
            with (
                patch.object(config, "PROJECT_ROOT", root),
                patch.dict(os.environ, {"PORT": "8888"}, clear=True),
            ):
                config.load()
                self.assertEqual(os.environ["PORT"], "8888")
                self.assertEqual(os.environ["OPENAI_API_KEY"], "synthetic-value")
                self.assertNotIn("UNKNOWN_SETTING", os.environ)

    def test_entry_point_works_outside_repository(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run(
                [sys.executable, "-m", "workweave", "--help"],
                cwd=directory,
                capture_output=True,
                text=True,
                timeout=10,
            )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("--host", result.stdout)
        self.assertIn("--port", result.stdout)
        self.assertTrue((PROJECT_ROOT / "pyproject.toml").is_file())

    def test_api_mode_does_not_require_static_assets(self):
        from workweave import server

        with (
            tempfile.TemporaryDirectory() as directory,
            patch.object(server, "ROOT", Path(directory)),
            patch.object(server, "load"),
            patch("sys.argv", ["workweave"]),
        ):
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                server.main()
            with (
                patch("sys.argv", ["workweave", "--api-only"]),
                patch.object(server, "ThreadingHTTPServer") as http,
            ):
                running = http.return_value.__enter__.return_value
                running.serve_forever.side_effect = KeyboardInterrupt
                with contextlib.redirect_stdout(io.StringIO()):
                    server.main()
                self.assertFalse(running.serve_frontend)
                running.serve_forever.assert_called_once()
