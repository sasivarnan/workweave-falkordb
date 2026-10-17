"""Paid live check: two agent operations against a disposable local Docker graph.

Uses the configured provider and the normal usage ledger unless AI_USAGE_DB is set.
Never resets a ledger or a visitor's graph. Run only when paid API calls are intended.
"""

import json
import os
import secrets
from pathlib import Path
from workweave.config import load

from workweave.graph import Store
from workweave.agent import run, provider
from workweave.impact import run as impact
from workweave.access import reserve

load()
os.environ.update(FALKORDB_HOST="127.0.0.1", FALKORDB_PORT="6381", FALKORDB_SSL="false")
os.environ.pop("FALKORDB_PASSWORD", None)
os.environ.pop("FALKORDB_USERNAME", None)

store = Store(secrets.token_hex(16))
question = "What changed for my work, who else is affected, and whom should I ask? Include every affected task and its dependency route count."
try:
    store.seed()
    store.action("review")
    store.action("complete")
    store.action("accept", "Review checkout states with Leo.")
    impact(store, "import")
    store.action("replace")
    before_context = store.context()
    reserve()
    before, _ = run(store, question)
    experiment = impact(store, "remove")["experiment"]
    reserve()
    after, _ = run(store, question)
    before_ids = [f["id"] for f in before["agentResult"]["facts"]]
    after_ids = [f["id"] for f in after["agentResult"]["facts"]]
    report = {
        "question": question,
        "provider": provider(),
        "model": os.getenv("OPENAI_MODEL") if provider() == "openai" else os.getenv("GEMINI_MODEL"),
        "before": before["agentResult"],
        "after": after["agentResult"],
        "documentsUnchanged": experiment["documentsUnchanged"],
        "checks": {
            "billingRemoved": "work:BILL-204" in before_ids and "work:BILL-204" not in after_ids,
            "supportRetained": "work:SUP-310" in before_ids and "work:SUP-310" in after_ids,
            "stalePlan": "plan" in before_ids,
            "reviewer": any(x.startswith("person:") for x in before_ids),
            "noPlanWrite": store.context()["plan"] == before_context["plan"],
        },
    }
    Path("reports/agent-live.json").write_text(json.dumps(report, indent=2) + "\n")
    print(
        json.dumps(
            {
                "checks": report["checks"],
                "documentsUnchanged": report["documentsUnchanged"],
                "beforeTools": before["agentResult"]["tools"],
                "afterTools": after["agentResult"]["tools"],
            }
        )
    )
    assert all(report["checks"].values()) and report["documentsUnchanged"]
finally:
    store.g.delete()
