# Validation

These checks use small, builder-authored synthetic fixtures. They are not production accuracy, performance, or general RAG benchmarks.

| Check | Last recorded result | Reproduce |
| --- | --- | --- |
| Backend, graph and provider contracts | 63 tests passed | `uv run --locked python -m unittest discover -s tests -v` |
| Frontend state and graph-proof validation | 4 tests passed | `npm test --prefix frontend` |
| Cross-team impact | 7 cases passed | `uv run --locked python scripts/evaluate_impact.py` |
| Relationship changes with identical source text | 4 cases passed | `uv run --locked python scripts/evaluate_relationships.py` |
| Graph retrieval diagnostic | 8 cases passed | `uv run --locked python scripts/evaluate.py` |

Integration tests create isolated disposable graphs and delete only those graphs. Provider contract tests mock model responses. Browser checks covered the dependency removal/restoration proof and all 11 employee tour stops; independent user feedback is pending.

## Saved reports

- [Cross-team impact](reports/impact-evaluation-results.json): affected sets, alternate routes and source-content preservation.
- [Relationship changes](reports/relationship-evaluation-results.json): guidance changes when relationships change but document text remains equal.
- [Retrieval diagnostic](reports/evaluation-results.json): graph guidance 8/8; simple word-overlap retrieval 1/8. The graph receives curated relationships and approval flags. This is not a vector-RAG comparison.
- [Paired model diagnostic](reports/model-evaluation-results.json): document guidance 4/8; graph-context guidance 6/8 with the same configured gpt-4.1-mini model. The model failed both required-abstention cases; two graph-context answers had invalid citation IDs. The application therefore keeps factual guidance and action checks deterministic.

The paired model report records 16 live calls. Do not run `scripts/evaluate_model.py` unless you intend to spend provider credits. Other diagnostic commands above do not call a model.

## Remaining release checks

Public HTTPS deployment, hosted storage after restart, full mobile/keyboard review, participant technical review, independent user feedback and the final demo video remain pending. A passing local build does not establish any of these.

## uv package and container checks

Python code is installed from src/workweave with a committed uv.lock. The 63 backend tests include package fixture loading, configuration priority and the module entry point from another directory. A second clean, non-editable uv environment passed fixture and CLI checks. Source and wheel builds passed.

The Docker image was built and tested as UID 10001: frontend, database health, context API, packaged fixture, writable usage directory and SIGTERM shutdown passed. No local secrets or internal notes were copied into the runtime. This does not establish hosted persistence, production authentication or a full security audit.
