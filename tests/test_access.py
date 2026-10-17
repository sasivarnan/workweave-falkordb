import json
import os
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
from workweave.access import enabled, reserve, BudgetExceeded
from workweave.server import Handler, ThreadingHTTPServer


class AccessTests(unittest.TestCase):
    def test_ai_requires_selected_provider_key_and_honors_disable(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(enabled("openai"))
            os.environ["OPENAI_API_KEY"] = "test-key-never-used"
            self.assertTrue(enabled("openai"))
            self.assertFalse(enabled("gemini"))
            self.assertFalse(enabled("unknown"))
            os.environ["AI_ENABLED"] = "false"
            self.assertFalse(enabled("openai"))
            os.environ["AI_ENABLED"] = "true"
            self.assertTrue(enabled("openai"))

    def test_budget_survives_reopen_and_windows(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "usage.sqlite3"
            reserve(p, 10000, (1, 2, 3))
            with self.assertRaises(BudgetExceeded):
                reserve(p, 10001, (1, 2, 3))
            reserve(p, 14000, (1, 2, 3))
            with self.assertRaises(BudgetExceeded):
                reserve(p, 18000, (1, 2, 3))
            reserve(p, 100000, (1, 2, 3))
            with self.assertRaises(BudgetExceeded):
                reserve(p, 200000, (1, 2, 3))

    def test_concurrent_reservations_respect_cap(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "usage.sqlite3"

            def attempt(_):
                try:
                    reserve(p, 10000, (3, 3, 3))
                    return True
                except BudgetExceeded:
                    return False

            with ThreadPoolExecutor(max_workers=6) as pool:
                self.assertEqual(sum(pool.map(attempt, range(6))), 3)

    def test_http_server_setting_blocks_provider_and_budget_is_shared(self):
        with (
            tempfile.TemporaryDirectory() as tmp,
            patch.dict(
                os.environ,
                {
                    "AI_ENABLED": "false",
                    "AI_PROVIDER": "openai",
                    "OPENAI_API_KEY": "test-key-never-used",
                    "AI_USAGE_DB": str(Path(tmp) / "usage.sqlite3"),
                    "AI_HOURLY_LIMIT": "1",
                    "AI_DAILY_LIMIT": "1",
                    "AI_TOTAL_LIMIT": "1",
                },
            ),
            patch("workweave.server.Store") as store,
            patch(
                "workweave.server.run", return_value=({"people": [], "ambiguous": True}, None)
            ) as agent,
        ):
            store.return_value.trace = []
            server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()

            def send():
                headers = {"Content-Type": "application/json", "X-Workweave": "portal"}
                req = urllib.request.Request(
                    "http://127.0.0.1:" + str(server.server_port) + "/api/agent",
                    data=b'{"prompt":"test"}',
                    headers=headers,
                )
                try:
                    with urllib.request.urlopen(req) as r:
                        return r.status, json.load(r)
                except urllib.error.HTTPError as e:
                    return e.code, json.load(e)

            try:
                self.assertEqual(send()[0], 403)
                agent.assert_not_called()
                store.assert_not_called()
                os.environ["AI_ENABLED"] = "true"
                self.assertEqual(send()[0], 200)
                self.assertEqual(agent.call_count, 1)
                self.assertEqual(send()[0], 429)
                self.assertEqual(agent.call_count, 1)
                with patch("workweave.server.reserve", side_effect=OSError("storage unavailable")):
                    self.assertEqual(send()[0], 503)
                    self.assertEqual(agent.call_count, 1)
            finally:
                server.shutdown()
                server.server_close()
                thread.join()

    def test_workspace_settings_api_contains_no_secrets(self):
        with patch("workweave.server.Store") as store:
            server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                with urllib.request.urlopen(
                    "http://127.0.0.1:" + str(server.server_port) + "/api/workspace"
                ) as response:
                    self.assertEqual(response.headers["Cache-Control"], "no-store")
                    data = json.load(response)
                self.assertEqual(set(data), {"appName", "defaultAssignment", "demo"})
                self.assertEqual(data["appName"], "Workweave")
                self.assertEqual(data["demo"]["scenario"]["approver"], "Priya Shah")
                self.assertEqual(data["defaultAssignment"], data["demo"]["assignment"])
                store.assert_not_called()
            finally:
                server.shutdown()
                server.server_close()
                thread.join()

    def test_record_routes_serve_app_and_unknown_paths_stay_404(self):
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as directory:
            Path(directory, "index.html").write_text("<html>workspace shell</html>")
            with patch("workweave.server.ROOT", Path(directory)):
                server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
                thread = threading.Thread(target=server.serve_forever, daemon=True)
                thread.start()
                base = "http://127.0.0.1:" + str(server.server_port)
                try:
                    for path in [
                        "/tasks/checkout",
                        "/calendar/release-review",
                        "/knowledge/adr",
                        "/demo-controls/evidence",
                        "/knowledge?q=payment",
                    ]:
                        with urllib.request.urlopen(base + path) as response:
                            self.assertIn(b"workspace shell", response.read())
                    for path in ["/api/unknown", "/private/file", "/tasks/extra/nested"]:
                        with self.assertRaises(urllib.error.HTTPError) as error:
                            urllib.request.urlopen(base + path)
                        self.assertEqual(error.exception.code, 404)
                finally:
                    server.shutdown()
                    server.server_close()
                    thread.join()


if __name__ == "__main__":
    unittest.main()
