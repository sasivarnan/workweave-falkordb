# Verification report

Date: October 16, 2026.

## Completed

17 automated checks passed against a local FalkorDB container and mocked model responses.

Graph integration checks: current guidance, five-node conflict path, native shortest path, replacement decision and stale accepted plan, missing owner, completed training, new-session retrieval, visitor isolation, conflicting decisions, duplicate initialization, reset, and invalid actions.

Agent checks: missing key produces a clear error; a valid function-call response can select component order; an unknown model tool is rejected. Invalid layout selection is also rejected.

The model responses in these checks are mocked. No live model quality, latency, or free-tier availability has been established.

## Pending

- Live Gemini verification is optional; OpenAI is now the tested provider.
- Official A2UI schema conformance beyond the custom supported subset.
- Public deployment, secure database connection, and persistence after restarts.
- Same-model document-search baseline. The separate eight-case graph diagnostic is complete; see below.
- Real-user observation and feedback.
- Final demo video and blog measurements.

The graph-depth comparison in the portal is a product demonstration. It is not a benchmark against retrieval systems.

## Live OpenAI verification

GPT-6 Luna completed the function-call and schema-constrained layout workflow against real local FalkorDB. One successful measured run took 3.23 seconds. It returned Provider B and the component order SummaryCard, EvidenceComparison, Checklist, PersonCard, ProgressCard. This single run is a connectivity and contract check, not a quality benchmark. The initial function-call request required reasoning_effort=none; the adapter now supplies it for GPT-6 models. The key is excluded from Git, Docker build context, and source archives.

## shadcn rewrite checks

The official preset decoded as base-rhea, violet, neutral, Public Sans and Geist headings. React and Vite production compilation passed. Browser testing verified the new portal and a live OpenAI request. The graph suite still has 17 passing checks after adding execution-plan evidence. Docker Compose and persistence are configured; restart persistence must be verified separately before public deployment.

Browser inspection confirmed Node By Index Scan for the assignment lookup. The health endpoint reported the database reachable and the agent configured. Source navigation opened the selected original document.

## Minimal layout verification

The production build passed after the UI reduction. Browser checks confirmed saving a plan and opening the official Trace evidence view. No backend changes were made in this UI pass.

## Product workflow pass

21 checks pass. New checks cover assignment-scoped guidance, reviewers, training, saved plans, unknown-assignment rejection, and reading acknowledgements. Browser checks verified refund policy navigation and progress rising to 50% after reading. The main view no longer shows judge controls or model labels.

## Employee home validation

22 automated checks passed after adding the employee home. The new graph check verifies five ordered week steps, reviewers across both assignments, idempotent migration, retained notes, and reviewer removal. Frontend production build passed. Browser checks verified Home, a first-day document link, and navigation to checkout with the correct guidance and reviewer.

23 checks passed after adding cross-assignment home findings. The new test verifies that a refund context still surfaces the affected checkout task, follows the replacement decision, and hides unapproved decisions. Production build passed. Browser checks verified the affected-task action and approved-source document.

## Reproducible eight-case evaluation

Run `python scripts/evaluate.py` with local FalkorDB. Output: `evaluation-results.json` and the public UI report. The run passed 8/8 graph checks. A top-one word-overlap document retrieval diagnostic matched the expected guidance in 1/8 cases. This is not a same-model comparison or evidence of superiority over modern RAG. Both methods use the same document text; the graph method additionally receives curated relations and approval flags. Fixtures and expected answers are builder-authored. Missing-source and conflicting-approval cases require abstention. The missing-owner and stale-plan cases also check those behaviours. No model calls are made.

## Final resource-audit verification

27 tests pass. New cases cover prerequisite-gated review requests, repeated request updates, missing-reviewer refusal, same-title replacement identity, and native full-text lookup. A separate unique Compose project retained its graph across database stop/start. This proves that tested local persistence configuration, not public deployment availability.
