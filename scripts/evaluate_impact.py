"""Reproduce the authored cross-team dependency experiment without AI calls."""

import json
import secrets
from pathlib import Path
from workweave.graph import Store
from workweave.impact import run

root = Path(__file__).resolve().parents[1]
store = Store(secrets.token_hex(16))
store.seed()
try:
    before = run(store, "import")
    after = run(store, "remove")
    restored = run(store, "restore")
    rows = [
        {
            "case": "Cross-team affected set",
            "passed": {item["id"] for item in before["items"]}
            == {"PAY-108", "BILL-204", "SUP-310", "SUP-311"},
        },
        {
            "case": "Unrelated service stays outside scope",
            "passed": [item["id"] for item in before["excluded"]] == ["HR-12"],
        },
        {
            "case": "Edge removal excludes Billing but keeps alternate Support routes",
            "passed": after["experiment"]["removed"] == ["BILL-204"]
            and after["experiment"]["afterRoutes"]["SUP-310"] == 1,
        },
        {
            "case": "Source content stays byte-for-byte equal",
            "passed": after["experiment"]["documentsUnchanged"],
        },
        {
            "case": "Restoring the edge recovers Billing",
            "passed": restored["experiment"]["added"] == ["BILL-204"],
        },
        {
            "case": "Missing owner and unmatched notes stay unresolved",
            "passed": next(item for item in before["items"] if item["id"] == "SUP-311")["owners"]
            == []
            and len(before["unresolved"]) == 1,
        },
        {
            "case": "Native shortest-path procedure supplies indirect explanations",
            "passed": all(
                item["algorithm"] == "algo.SPpaths"
                for item in before["items"]
                if item["serviceId"] != "checkout-service"
            ),
        },
    ]
    report = {
        "method": "Builder-authored normalized synthetic exports. Fixed expected IDs. Bounded directed simple-path traversal (up to five service links), native algo.SPpaths explanations, one removed/restored dependency. No AI calls. This is a correctness demonstration, not a performance or retrieval benchmark.",
        "results": rows,
        "before": [
            {
                "id": item["id"],
                "team": item["team"],
                "routes": item["routeCount"],
                "path": item["explanation"],
            }
            for item in before["items"]
        ],
        "experiment": after["experiment"],
        "restored": restored["experiment"],
        "limitations": [
            "Small curated fixture; not independent external data.",
            "Identifiers and explicit service dependency references are supplied, not extracted from prose.",
            "No live OAuth connectors, incremental synchronization, or production permission model.",
            "No path within five links does not prove absence of impact beyond that bound.",
        ],
    }
    (root / "impact-evaluation-results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(
        str(sum(row["passed"] for row in rows)) + "/" + str(len(rows)) + " cross-team checks passed"
    )
    if not all(row["passed"] for row in rows):
        raise SystemExit(1)
finally:
    store.g.delete()
