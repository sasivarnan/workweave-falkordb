# Cross-team decision impact

This is the flagship graph workflow: a shared service decision can affect work owned by several teams through different dependency paths.

## User flow

Open Cross-team impact, load the synthetic source exports, then expand Why affected? for a task. The UI shows the shortest verified path, alternate paths, assigned owner, source issue key, calendar reference, and meeting notes.

In the sample, Billing depends on Checkout. Support depends on both Billing and Checkout. Removing Billing → Checkout makes the Billing task leave the affected set. Support stays affected through its direct Checkout dependency. Restoring the edge restores Billing. The content hash stays equal throughout the experiment.

The importer leaves unmatched notes and calendar events unlinked. Missing task owners remain missing.

## Source import

`fixtures/company-sources.json` is a normalized synthetic export bundle, not a live vendor API response. It contains Jira-style issue keys, Calendar event IDs, meeting-instance references, Zoom-style note records, team/owner IDs, and a service registry dependency export.

`POST /api/impact` accepts only these server-owned operations:

- `import`: idempotently import the bundled fixture and analyze it.
- `analyze`: read the current workspace graph.
- `remove`: remove the one defined sample dependency and compare results.
- `restore`: restore that dependency and compare results.

No arbitrary query, file path, source URL, employee ID, or relationship ID can be submitted to this endpoint. It uses the same cookie isolation and request limits as other workspace APIs. The endpoint returns `{analysis, trace}` and makes no model calls.

Issue links require explicit issue keys. Note links require exactly one matching event for the meeting identifier. Similar titles are not enough. Real Zoom recurring meetings need unique occurrence identifiers, not only a reusable meeting number. Live adapters, incremental sync, deletions, and permissions are not implemented.

## Graph computation

Bounded directed Cypher traverses `WorkItem → TOUCHES → Service → DEPENDS_ON*0..5 → changed Service`. It excludes repeated nodes in each path and deduplicates tasks by source ID and routes by service IDs. Identical display names cannot collapse different paths.

Native `algo.SPpaths` explains indirect service dependencies, with outgoing direction, unit weights, maxLen 5, and one shortest path. Alternative route counts come from bounded Cypher, not from the native shortest-path result. Direct service links need no pathfinding. An unavailable native explanation fails the analysis rather than inventing a path.

The decision must pass the existing approval, source, approver, and effective-time checks. The trace contains the executed queries, parameters, row counts, and timings. Query timings are not a scale benchmark.

## Proof

Run `python scripts/evaluate_impact.py` for seven authored correctness checks and `impact-evaluation-results.json`. The checked-in report shows expected affected IDs, the unaffected task, route counts before/after, equal content hashes, and restoration.

The test suite covers cycles, duplicate names, alternate paths, missing owners, missing authority, ambiguous meeting IDs, workspace isolation, actual HTTP dispatch, native algorithm failure, and the five-link bound.

The content fingerprint includes IDs, labels, titles, and bodies of original documents and imported task, event, and note records. The experiment changes only a dependency relationship. This shows that document content alone does not determine the result. SQL with an equivalent relationship model could also solve it.

## Limits

Small builder-authored fixture. No independent user study, large-graph benchmark, real OAuth integration, general document ingestion, or production permission enforcement. The server displays a synthetic company-wide view within the visitor's isolated graph. Not reached within five links does not prove absence of impact beyond that bound or through missing links. The import does not populate all portal modules or create real Jira tasks, calendar invites, or Zoom notes.

## Validation

See [validation results and reproduction commands](../EVALUATION.md). Tests cover path direction, cycles, alternate routes, missing evidence, workspace isolation and the traversal bound.
