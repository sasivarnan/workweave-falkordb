import re
import json
import os
import secrets
import time
import threading
import mimetypes
from urllib.parse import urlsplit
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from http.cookies import SimpleCookie
import argparse
import signal
from workweave.paths import FRONTEND_DIR
from workweave.graph import Store, database
from workweave.ui import compose
from workweave.agent import run, provider
from workweave.access import enabled, reserve, BudgetExceeded
from workweave.config import load
from workweave.impact import run as run_impact
from workweave.workspace import APP_NAME, DEMO_ASSIGNMENT, DEMO_SCENARIO

ROOT = FRONTEND_DIR
LOCKS = {}
LIMITS = {}
GUARD = threading.Lock()
GLOBAL = []
AGENT_SLOTS = threading.BoundedSemaphore(2)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def respond(self, status, data, cookie=None):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def token(self):
        c = SimpleCookie()
        c.load(self.headers.get("Cookie", ""))
        token = c.get("workweave")
        if token and len(token.value) == 32 and all(x in "0123456789abcdef" for x in token.value):
            return token.value, None
        token = secrets.token_hex(16)
        return token, "workweave=" + token + "; Path=/; HttpOnly; SameSite=Strict" + (
            "; Secure" if os.getenv("COOKIE_SECURE") == "true" else ""
        )

    def do_GET(self):
        if self.path == "/api/workspace":
            return self.respond(
                200,
                {
                    "appName": APP_NAME,
                    "defaultAssignment": DEMO_ASSIGNMENT,
                    "demo": {"assignment": DEMO_ASSIGNMENT, "scenario": DEMO_SCENARIO},
                },
            )
        if self.path == "/api/access":
            return self.respond(200, {"aiEnabled": enabled(provider())})
        if self.path == "/api/health":
            try:
                database().connection.ping()
                return self.respond(
                    200,
                    {
                        "status": "ok",
                        "database": "reachable",
                        "agentConfigured": bool(
                            os.getenv("OPENAI_API_KEY")
                            if provider() == "openai"
                            else os.getenv("GEMINI_API_KEY")
                        ),
                    },
                )
            except Exception:
                return self.respond(503, {"status": "unavailable", "database": "unreachable"})
        if not getattr(self.server, "serve_frontend", True):
            return self.respond(404, {"error": "Use the frontend development server"})
        urlpath = urlsplit(self.path).path
        app_route = urlpath in [
            "/",
            "/tasks",
            "/calendar",
            "/knowledge",
            "/notes",
            "/people",
            "/decisions",
            "/impact",
            "/demo-controls",
            "/demo-controls/evidence",
        ] or bool(re.fullmatch(r"/(tasks|calendar|knowledge)/[a-zA-Z0-9_-]{1,100}", urlpath))
        if (
            not app_route
            and not urlpath.startswith("/assets/")
            and urlpath not in ["/catalog.json", "/evaluation.json"]
        ):
            return self.respond(404, {"error": "Not found"})
        path = (ROOT / ("index.html" if app_route else urlpath.lstrip("/"))).resolve()
        if ROOT.resolve() not in path.parents or not path.is_file():
            return self.respond(
                404, {"error": "Build the frontend with npm run build --prefix frontend"}
            )
        self.send_response(200)
        self.send_header(
            "Content-Type", mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        )
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'",
        )
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(path.read_bytes())

    def do_POST(self):
        # All writes require the same-origin UI header. No cross-origin CORS is enabled.
        if self.headers.get("X-Workweave") != "portal":
            return self.respond(403, {"error": "Use the Workweave portal"})
        if self.path not in [
            "/api/reset",
            "/api/demo/setup",
            "/api/action",
            "/api/context",
            "/api/agent",
            "/api/search",
            "/api/impact",
        ]:
            return self.respond(404, {"error": "Not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 0 or length > 4096:
                raise ValueError("Request too large")
            body = json.loads(self.rfile.read(length) or "{}")
            if not isinstance(body, dict):
                raise ValueError("Invalid request")
            if self.path == "/api/agent" and not enabled(provider()):
                return self.respond(
                    403,
                    {
                        "error": "AI assistance is not enabled on the server. Graph workflows remain available."
                    },
                )
            token, cookie = self.token()
            with GUARD:
                now = time.time()
                GLOBAL[:] = [t for t in GLOBAL if now - t < 60]
                if len(GLOBAL) >= 120:
                    return self.respond(
                        429, {"error": "The demo is busy. Try again in one minute."}, cookie
                    )
                if len(LOCKS) >= 200 and token not in LOCKS:
                    return self.respond(
                        429, {"error": "The demo workspace limit is reached."}, cookie
                    )
                recent = [t for t in LIMITS.get(token, []) if now - t < 60]
                if len(recent) >= 30:
                    return self.respond(
                        429, {"error": "Request limit reached. Wait one minute."}, cookie
                    )
                GLOBAL.append(now)
                LIMITS[token] = recent + [now]
                lock = LOCKS.setdefault(token, threading.Lock())
            with lock:
                s = Store(
                    token,
                    DEMO_ASSIGNMENT
                    if self.path in ["/api/impact", "/api/demo/setup"]
                    else body.get("assignment") or "checkout",
                )
                s.seed()
                mode = "Graph tools · no model call"
                if self.path == "/api/impact":
                    return self.respond(
                        200,
                        {
                            "analysis": run_impact(s, body.get("operation", "analyze")),
                            "trace": s.trace,
                        },
                        cookie,
                    )
                if self.path == "/api/demo/setup":
                    s.reset()
                    s.action("review")
                    s.action("complete")
                    s.action("accept", DEMO_SCENARIO["note"])
                    run_impact(s, "import")
                elif self.path == "/api/reset":
                    s.reset()
                elif self.path == "/api/action":
                    s.action(body.get("name"), str(body.get("note", "")))
                elif self.path not in ["/api/context", "/api/agent", "/api/search", "/api/impact"]:
                    return self.respond(404, {"error": "Not found"}, cookie)
                if self.path == "/api/agent":
                    if not AGENT_SLOTS.acquire(blocking=False):
                        return self.respond(
                            429, {"error": "The agent is busy. Try again shortly."}, cookie
                        )
                    try:
                        reserve()
                        context, selection = run(s, str(body.get("prompt", "")))
                        mode = "Live " + provider().title() + " tool call + model-selected layout"
                    finally:
                        AGENT_SLOTS.release()
                else:
                    context = s.context()
                    selection = None
                    if self.path == "/api/search":
                        context["searchResults"] = s.search(body.get("query", ""))
                self.respond(
                    200,
                    {"messages": compose(context, selection), "trace": s.trace, "mode": mode},
                    cookie,
                )
        except BudgetExceeded as e:
            self.respond(429, {"error": str(e)})
        except ValueError as e:
            self.respond(400, {"error": str(e)})
        except Exception:
            self.respond(
                503,
                {
                    "error": "The database or AI provider is unavailable. No answer was substituted. Check the server configuration and connection."
                },
            )


def main():
    load()
    parser = argparse.ArgumentParser(description="Run the Workweave employee workspace.")
    parser.add_argument("--host", default=os.getenv("WORKWEAVE_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8080")))
    parser.add_argument(
        "--api-only", action="store_true", help="Run APIs without requiring a frontend build"
    )
    args = parser.parse_args()
    if not args.api_only and not (ROOT / "index.html").is_file():
        parser.error(
            "Frontend build missing. Run npm ci --prefix frontend and npm run build --prefix frontend."
        )
    with ThreadingHTTPServer((args.host, args.port), Handler) as server:
        server.serve_frontend = not args.api_only
        print(f"Workweave listening on http://{args.host}:{server.server_port}", flush=True)

        def stop_server(signum, frame):
            raise KeyboardInterrupt

        previous = signal.signal(signal.SIGTERM, stop_server)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            signal.signal(signal.SIGTERM, previous)


if __name__ == "__main__":
    main()
