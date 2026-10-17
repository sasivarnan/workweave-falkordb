"""Fail-closed AI access and durable operation budgets. No provider key reaches UI."""

import hmac
import os
import sqlite3
import time
from pathlib import Path
from workweave.paths import PROJECT_ROOT


class AccessDenied(Exception):
    pass


class BudgetExceeded(Exception):
    pass


def authorized(code):
    expected = os.getenv("AI_ACCESS_CODE", "")
    return bool(
        len(expected) >= 16
        and isinstance(code, str)
        and hmac.compare_digest(code.encode(), expected.encode())
    )


def reserve(path=None, now=None, limits=None):
    path = Path(
        path or (os.getenv("AI_USAGE_DB") or str(PROJECT_ROOT / ".data" / "ai-usage.sqlite3"))
    )
    limits = limits or tuple(
        int(os.getenv(k, d))
        for k, d in [("AI_HOURLY_LIMIT", "5"), ("AI_DAILY_LIMIT", "10"), ("AI_TOTAL_LIMIT", "30")]
    )
    if any(n < 1 for n in limits):
        raise ValueError("AI limits must be positive")
    path.parent.mkdir(parents=True, exist_ok=True)
    now = time.time() if now is None else now
    with sqlite3.connect(str(path), timeout=5) as db:
        db.execute("CREATE TABLE IF NOT EXISTS operations (reserved_at REAL NOT NULL)")
        db.execute("BEGIN IMMEDIATE")
        total, hour, day = db.execute(
            "SELECT count(*),coalesce(sum(reserved_at>?),0),coalesce(sum(reserved_at>?),0) FROM operations",
            (now - 3600, now - 86400),
        ).fetchone()
        if hour >= limits[0] or day >= limits[1] or total >= limits[2]:
            raise BudgetExceeded(
                "The AI usage budget is reached. Graph exploration remains available."
            )
        db.execute("INSERT INTO operations VALUES (?)", (now,))
    # Reserve the full two-call operation before network access; failures also consume it.
    return {"hour": hour + 1, "day": day + 1, "total": total + 1}
