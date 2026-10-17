"""Reproducible synthetic evaluation; no model calls or competitor claims."""

import json
import re
import secrets
import time
from pathlib import Path
from workweave.graph import Store


def lexical(documents, question):
    terms = set(re.findall(r"[a-z]+", question.lower()))
    ranked = sorted(
        documents,
        key=lambda d: (-len(terms & set(re.findall(r"[a-z]+", (d[1] + " " + d[2]).lower()))), d[0]),
    )
    doc = ranked[0]
    text = doc[2]
    answer = next(
        ("Use Provider " + p for p in ("A", "B", "C") if "Use Provider " + p in text), None
    )
    if "Provider B replaces Provider A" in text:
        answer = "Use Provider B"
    if "Provider C replaces Provider B" in text:
        answer = "Use Provider C"
    if "Run refund tests only" in text:
        answer = "Use sandbox transactions only"
    return answer, doc[1]


def main():
    cases = [
        ("Outdated starter guide", "checkout", "Use Provider B", ""),
        ("Decision replaced after plan acceptance", "checkout", "Use Provider C", "replace"),
        ("Unapproved replacement", "checkout", "Use Provider B", "unapprove"),
        ("Two approved current decisions", "checkout", None, "conflict"),
        ("Current decision has no source", "checkout", None, "source"),
        ("Separate refund assignment", "refunds", "Use sandbox transactions only", ""),
        ("Reviewer removed", "checkout", "Use Provider B", "remove-owner"),
        ("Saved plan becomes stale", "checkout", "Use Provider C", "stale"),
    ]
    results = []
    for title, assignment, expected, change in cases:
        s = Store(secrets.token_hex(16), assignment)
        s.seed()
        try:
            if change in ("replace", "remove-owner"):
                s.action(change)
            if change == "unapprove":
                s.action("replace")
                s.q(
                    "fixture",
                    'MATCH (d:Decision {id:"provider-c"}) SET d.approved=false',
                    write=True,
                )
            if change == "conflict":
                s.q(
                    "fixture",
                    'MATCH (s:Service {id:"checkout-service"}) CREATE (:Decision {id:"parallel",title:"Use Provider C",approved:true})-[:APPLIES_TO]->(s)',
                    write=True,
                )
            if change == "source":
                s.q(
                    "fixture",
                    'MATCH (:Decision {id:"provider-b"})-[r:SUPPORTED_BY]->() DELETE r',
                    write=True,
                )
            if change == "stale":
                s.action("accept", "Check pending and failed states")
                s.action("replace")
            start = time.perf_counter()
            c = s.context()
            elapsed = round((time.perf_counter() - start) * 1000, 2)
            graph = None if c["ambiguous"] else c["current"]
            question = (
                "checkout provider integration starter guide"
                if assignment == "checkout"
                else "refund sandbox test policy"
            )
            baseline, source = lexical(c["sources"], question)
            behavior = (
                not c["people"]
                if change == "remove-owner"
                else c["needsReview"]
                if change == "stale"
                else True
            )
            results.append(
                dict(
                    case=title,
                    question=question,
                    expected=expected,
                    graph=graph,
                    lexical=baseline,
                    lexicalSource=source,
                    passed=graph == expected and behavior,
                    lexicalPassed=baseline == expected,
                    ms=elapsed,
                    detail="Reviewer absence detected; no substitute inferred."
                    if change == "remove-owner"
                    else "Saved plan flagged for review."
                    if change == "stale"
                    else "Abstained because evidence was incomplete or conflicting."
                    if expected is None
                    else "Current assignment guidance resolved.",
                )
            )
        finally:
            s.g.delete()
    report = dict(
        title="Workweave evidence checks",
        dataset="Eight authored synthetic cases. Not real employee data.",
        method="Both methods receive the same document corpus. Baseline ranks documents by question-word overlap and extracts provider advice from its top result. Workweave also uses curated assignment, approval, supersession, and source relationships. This is a narrow retrieval diagnostic, not a same-model RAG benchmark.",
        limitations=[
            "Fixtures and expected answers were authored by the project builder.",
            "Graph relationships are supplied as structured data; ingestion quality is not evaluated.",
            "No general LLM, vector-search, or production accuracy claim.",
            "Single local run; timings include all context queries, not model inference.",
        ],
        results=results,
    )
    root = Path(__file__).resolve().parents[1]
    model_report = root / "model-evaluation-results.json"
    if model_report.exists():
        report["modelDiagnostic"] = json.loads(model_report.read_text())
    relationship_report = root / "relationship-evaluation-results.json"
    if relationship_report.exists():
        report["relationshipDiagnostic"] = json.loads(relationship_report.read_text())
    for target in [root / "frontend/public/evaluation.json", root / "evaluation-results.json"]:
        target.write_text(json.dumps(report, indent=2) + "\n")
    print(
        f"Graph checks: {sum(r['passed'] for r in results)}/8; lexical diagnostic: {sum(r['lexicalPassed'] for r in results)}/8"
    )
    if not all(r["passed"] for r in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
