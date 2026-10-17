# Workweave: connect company work to current decisions

Draft. Replace pending items with verified results before publication.

## The problem

A starter guide can remain readable after its underlying decision changes. Any employee needs the current decision, its source, the person responsible, and the prerequisites for the work. Meetings and notes need the same context.

## What we built

Workweave connects assignments, services, decisions, documents, reviewers, and training in FalkorDB. It follows explicit approval and supersession relationships. It preserves an accepted plan and flags it for review after a decision changes.

## The cross-team proof

The flagship workflow imports normalized synthetic task, calendar, note, and service-registry exports. Exact issue keys link meetings to tasks; unique meeting identifiers link notes to events. Unmatched records remain unresolved.

Billing depends on Checkout. Support depends on both Billing and Checkout. Bounded Cypher finds affected work; native `algo.SPpaths` supplies the shortest explanation for indirect dependencies. The UI exposes alternate routes and recorded owners. Removing Billing → Checkout drops the Billing task while Support remains reachable. Task, event, note, and document content hashes stay equal. Restoring the edge recovers Billing.

This is a seven-case authored correctness demonstration, not a performance benchmark. The independent expectations, raw results, and reproducible script are included in the repository. Cycle, ambiguity, depth-bound, missing owner, and native-procedure failure checks are part of the test suite.

## Why the graph changes the answer

The conflict path is document → historical decision ← replacement decision → service ← assignment. Looking only at the assignment's source does not expose this connection. Show the actual path and query from the app here.

## How the agent and interface work

The model calls a fixed workspace-context tool. It then selects the order of validated A2UI components. Database results supply facts. This separates model-selected presentation from verified company context. The current implementation supports a custom A2UI v0.9 subset, not a complete general renderer.

## The parts we tested

The local test suite has 60 passing checks. It covers persistent state, workspace isolation, outdated guidance, missing ownership, conflicting decisions, reset, and model contract failures. Model responses in the contract tests are mocked.

A separate reproducible evaluation passed eight graph cases: outdated guidance, replacement, unapproved replacement, conflicting approvals, missing source, a second assignment, missing reviewer, and stale saved plan. A simple word-overlap top-document diagnostic matched expected guidance in one case. This narrow diagnostic is not a same-model RAG benchmark. Workweave receives curated graph relationships that the text retrieval method does not use; ingestion quality is outside this evaluation. The script and full outputs ship with the source.

A live OpenAI GPT-6 Luna function-call and layout request completed in 3.23 seconds in one earlier local run. This confirms connectivity, not model quality or a latency benchmark. Public URL, recorded demo, same-model comparison, and user observations remain pending.

## A bug worth explaining

Reset initially deleted nodes but retained indexes. Reinitialization failed when it tried to create the same indexes. Reset now recreates only the visitor's disposable sample graph. The reset integration test passes.

## Limits

The company is fictional. The app does not grant access, send messages, or replace an HR system. There is one sample employee with two assignments. Missing relationships are reported as gaps. User testing is pending.

## AI assistance and decisions

Codex assisted with code, sample data, design, tests, and documentation. The participant selected the company workspace problem and required graph-based evidence, A2UI, judge-controlled changes, and a hosted demo. Add the participant's review and learning before submission.

## Community Wisdom

Akash Pal, The A2UI Contract: https://dev.to/akashpal/the-a2ui-contract-a-deep-dive-into-agent-to-ui-architecture-4i00 — separate layout selection from computed data.

voyagi, Agent memory that tells you when it couldn't check: https://dev.to/voyagi/agent-memory-that-tells-you-when-it-couldnt-check-2aao — distinguish retrieval failure from missing information and present measured evidence.

## Links to add

Public repository, live demo, demo video, graph model, evaluation results, and organizer submission link.

## From finding to action

The prototype now stores a review request only after the employee has read current guidance, completed required training, saved non-empty working notes and has a recorded reviewer. The request links the decision identity and reviewer. No message is sent. A test found that comparing decision titles could miss a replacement with the same text; the plan check now compares source-linked decision IDs.

Company knowledge uses FalkorDB full-text indexing over document titles and bodies. Search relevance helps find documents; approval and supersession relationships still determine operational guidance.

## The failure that made the design clearer

I ran a paired diagnostic with the same gpt-4.1-mini model, questions, output schema and full synthetic source corpus. Document-only inputs produced correct guidance in 4/8 cases; graph-context inputs produced 6/8. More context was not enough: the model still gave an answer in both cases that required abstention, and two otherwise correct graph-context answers supplied document titles instead of citation IDs. The run used 16 calls and 9,600 reported tokens.

This is a small builder-authored diagnostic, not a vector-RAG benchmark. Its practical result is a product decision: the model may organize the interface, but graph checks determine current guidance and whether a review request can be stored. The eight deterministic graph cases passed, including those refusal cases. Raw results and the script are public.

## A stronger test than a graph screenshot

I kept all source document IDs, titles and bodies byte-identical, then changed only relationships in four isolated fixtures. Removing the replacement link made approval ambiguous. Removing the current source link blocked plan acceptance. Changing the reviewer relationship changed the correct reviewer to Noah even while the old review-policy document still named Leo. Removing the task-service link made task context unavailable. All four checks passed.

A text-only system receives identical input in each pair and cannot distinguish the changed company state without another source of relationship information. FalkorDB supplies that operational structure in Workweave. SQL with an equivalent relationship model could also solve it; I do not claim otherwise. The product benefit is a source-backed next action with explicit authority checks, not a database exclusivity claim.
