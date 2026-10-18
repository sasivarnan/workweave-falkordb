# Validation

These checks use small, builder-authored synthetic fixtures. They are not production accuracy, performance, or general RAG benchmarks.

| Check | Last recorded result | Reproduce |
| --- | --- | --- |
| Backend, graph and provider contracts | 78 tests passed before usage-counter removal | `uv run --locked python -m unittest discover -s tests -v` |
| Frontend state, search URLs and graph-proof validation | 18 tests passed | `npm test --prefix frontend` |
| Cross-team impact | 7 cases passed | `uv run --locked python scripts/evaluate_impact.py` |
| Relationship changes with identical source text | 4 cases passed | `uv run --locked python scripts/evaluate_relationships.py` |
| Graph retrieval diagnostic | 8 cases passed | `uv run --locked python scripts/evaluate.py` |

Integration tests create isolated disposable graphs and delete only those graphs. Provider contract tests mock model responses. Browser checks covered the dependency removal/restoration proof and the nine-stop Home and navigation tour; independent user feedback is pending.

## Saved reports

- [Cross-team impact](reports/impact-evaluation-results.json): affected sets, alternate routes and source-content preservation.
- [Relationship changes](reports/relationship-evaluation-results.json): guidance changes when relationships change but document text remains equal.
- [Retrieval diagnostic](reports/evaluation-results.json): graph guidance 8/8; simple word-overlap retrieval 1/8. The graph receives curated relationships and approval flags. This is not a vector-RAG comparison.
- [Paired model diagnostic](reports/model-evaluation-results.json): document guidance 4/8; graph-context guidance 6/8 with the same configured gpt-4.1-mini model. The model failed both required-abstention cases; two graph-context answers had invalid citation IDs. The application therefore keeps factual guidance and action checks deterministic.

The paired model report records 16 live calls. Do not run `scripts/evaluate_model.py` unless you intend to spend provider credits. Other diagnostic commands above do not call a model.

## Remaining release checks

The [public Render deployment](https://workweave-falkordb.onrender.com/) serves frontend HTML, and `/api/health` reports `status: ok` and `database: reachable`. The participant reports that it connects to FalkorDB Cloud. Hosted storage after restart, full mobile/keyboard review, participant technical review, independent user feedback and the final demo video remain pending. The health check does not verify these items or a successful AI response.

## uv package and container checks

Python code is installed from src/workweave with a committed uv.lock. Package tests include fixture loading, configuration priority and the module entry point from another directory. A second clean, non-editable uv environment passed fixture and CLI checks. Source and wheel builds passed.

The Docker image was built and tested as UID 10001: frontend, database health, context API, packaged fixture, writable usage directory and SIGTERM shutdown passed. No local secrets or internal notes were copied into the runtime. This does not establish hosted persistence, production authentication or a full security audit.

Tour update: the Driver.js browser check covered all nine desktop stops without leaving Home, starting from Calendar, temporary sidebar expansion, completion, Escape and restoration of the original sidebar preference. Mobile layout was not included in this pass.

The historical paid-model report retains the earlier Provider A/B/C labels. Graph-only reports use the current fictional Stripe/Adyen/Razorpay scenario; no paid model evaluation was rerun for this label change.

## Live decision-impact agent check

[Recorded live result](reports/agent-live.json) uses the configured OpenAI model and an isolated local graph. The same question was asked before and after removal of Billing → Checkout. Billing left the answer; Support remained with one route instead of two. Source text was unchanged. Both answers identified the stale plan and linked reviewers. No saved plan changed. These are two live runs on one synthetic scenario, not a general accuracy benchmark. Gemini was not tested with a live key. To repeat the paid check against local Docker on port 6381, run `uv run --locked python scripts/evaluate_agent.py`. It makes two paid agent calls and deletes only its disposable graph.

Usage-counter removal: 16 targeted access and agent tests passed without provider calls. The current suite has two fewer tests because the SQLite counter was removed. Full graph checks above refer to the previous CI run.
