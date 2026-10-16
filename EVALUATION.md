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
- Same-model document-search baseline and the planned eight-case comparison.
- Real-user observation and feedback.
- Final demo video and blog measurements.

The graph-depth comparison in the portal is a product demonstration. It is not a benchmark against retrieval systems.

## Live OpenAI verification

GPT-6 Luna completed the function-call and schema-constrained layout workflow against real local FalkorDB. One successful measured run took 3.23 seconds. It returned Provider B and the component order SummaryCard, EvidenceComparison, Checklist, PersonCard, ProgressCard. This single run is a connectivity and contract check, not a quality benchmark. The initial function-call request required reasoning_effort=none; the adapter now supplies it for GPT-6 models. The key is excluded from Git, Docker build context, and source archives.
