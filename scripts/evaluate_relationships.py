"""Relationship ablation: same source text, different authority and ownership."""

import hashlib
import json
import secrets
from pathlib import Path
from workweave.graph import Store

root = Path(__file__).resolve().parents[1]
fixtures = [
    (
        "Remove the replacement link",
        'MATCH (:Decision {id:"provider-b"})-[r:SUPERSEDES]->() DELETE r',
        "Clarification required",
        "ambiguous",
    ),
    (
        "Remove the current source link",
        'MATCH (:Decision {id:"provider-b"})-[r:SUPPORTED_BY]->() DELETE r',
        "Clarification required",
        "ambiguous",
    ),
    (
        "Change the recorded reviewer",
        'MATCH (:Employee {id:"leo"})-[r:REVIEWER_FOR]->(:Service {id:"checkout-service"}) DELETE r WITH count(*) AS removed MATCH (n:Employee {id:"noah"}),(s:Service {id:"checkout-service"}) MERGE (n)-[:REVIEWER_FOR]->(s)',
        "Noah Williams",
        "reviewer",
    ),
    (
        "Disconnect the task from its service",
        'MATCH (:Assignment {id:"checkout"})-[r:TOUCHES]->() DELETE r',
        "Task context unavailable",
        "disconnected",
    ),
]


def digest(s):
    documents = s.q(
        "ablation_corpus", "MATCH (d:Document) RETURN d.id,d.title,d.body ORDER BY d.id"
    )
    return hashlib.sha256(json.dumps(documents, sort_keys=True).encode()).hexdigest()


rows = []
for name, query, expected, kind in fixtures:
    s = Store(secrets.token_hex(16))
    s.seed()
    try:
        before = s.context()
        fingerprint = digest(s)
        s.q("ablation_change", query, write=True)
        try:
            after = s.context()
            outcome = (
                "Clarification required"
                if after["ambiguous"]
                else next((p[1] for p in after["people"] if p[3] == "REVIEWER_FOR"), "No reviewer")
                if kind == "reviewer"
                else after["current"]
            )
        except ValueError:
            outcome = "Task context unavailable"
        unchanged = fingerprint == digest(s)
        blocked = None
        if kind == "ambiguous":
            try:
                s.action("accept", "Must not accept missing authority")
                blocked = False
            except ValueError:
                blocked = True
        rows.append(
            {
                "case": name,
                "before": next(p[1] for p in before["people"] if p[3] == "REVIEWER_FOR")
                if kind == "reviewer"
                else before["current"],
                "after": outcome,
                "documentsUnchanged": unchanged,
                "documentHash": fingerprint,
                "acceptanceBlocked": blocked,
                "passed": unchanged and outcome == expected and blocked is not False,
                "query": query,
            }
        )
    finally:
        s.g.delete()
report = {
    "method": "Four isolated synthetic graph mutations. Source document IDs, titles and bodies remain byte-for-byte identical. Only relationships change. Expected outcomes are builder-authored. Missing authority must also reject plan acceptance. No model calls.",
    "claim": "Document text alone cannot distinguish these paired states. FalkorDB relationships supply the missing authority and ownership information in this implementation. A relational database with an equivalent relationship model could also solve this; the test does not prove graph-database exclusivity.",
    "results": rows,
}
(root / "relationship-evaluation-results.json").write_text(json.dumps(report, indent=2) + "\n")
print(str(sum(r["passed"] for r in rows)) + "/4 relationship checks passed")
if not all(r["passed"] for r in rows):
    raise SystemExit(1)
