# FirstTask: finding outdated guidance before a new employee's first contribution

Draft. Replace pending items with verified results before publication.

## The problem

A starter guide can remain readable after its underlying decision changes. A new employee needs the current decision, its source, the person responsible, and the prerequisites for the assignment.

## What we built

FirstTask connects assignments, services, decisions, documents, reviewers, and training in FalkorDB. It follows explicit approval and supersession relationships. It preserves an accepted plan and flags it for review after a decision changes.

## Why the graph changes the answer

The conflict path is document → historical decision ← replacement decision → service ← assignment. Looking only at the assignment's source does not expose this connection. Show the actual path and query from the app here.

## How the agent and interface work

The model calls a fixed onboarding-context tool. It then selects the order of validated A2UI components. Database results supply facts. This separates model-selected presentation from verified company context. The current implementation supports a custom A2UI v0.9 subset, not a complete general renderer.

## The parts we tested

The local test suite has 15 passing checks. It covers persistent state, workspace isolation, outdated guidance, missing ownership, conflicting decisions, reset, and model contract failures. Model responses in the contract tests are mocked.

Pending: insert live model results, public URL, measured scenario results, and the same-model document-search baseline. Do not claim these have passed yet.

## A bug worth explaining

Reset initially deleted nodes but retained indexes. Reinitialization failed when it tried to create the same indexes. Reset now recreates only the visitor's disposable sample graph. The reset integration test passes.

## Limits

The company is fictional. The app does not grant access, send messages, or replace an HR system. There is one employee and assignment. Missing relationships are reported as gaps. User testing is pending.

## AI assistance and decisions

Codex assisted with code, sample data, design, tests, and documentation. The participant selected the onboarding problem and required graph-based evidence, A2UI, judge-controlled changes, and a hosted demo. Add the participant's review and learning before submission.

## Community Wisdom

Akash Pal, The A2UI Contract: https://dev.to/akashpal/the-a2ui-contract-a-deep-dive-into-agent-to-ui-architecture-4i00 — separate layout selection from computed data.

voyagi, Agent memory that tells you when it couldn't check: https://dev.to/voyagi/agent-memory-that-tells-you-when-it-couldnt-check-2aao — distinguish retrieval failure from missing information and present measured evidence.

## Links to add

Public repository, live demo, demo video, graph model, evaluation results, and organizer submission link.
