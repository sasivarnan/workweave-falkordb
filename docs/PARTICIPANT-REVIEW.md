# Participant technical review: 15 minutes

This review supports the event's AI-assistance and understanding rules. Read the files, perform the actions, and correct anything you cannot explain. Do not claim that AI-run tests are your own manual verification.

1. Explain the problem: a readable guide can recommend a superseded decision.
2. Open graph.py. Trace ASSIGNED_TO, TOUCHES, APPLIES_TO, SUPERSEDES and SUPPORTED_BY. Approval is explicit; newest text does not automatically win.
3. Run the walkthrough. Pause after replacement. Explain why the old plan remains stored but needs review.
4. Explain ambiguity: two current approvals or no source must block acceptance.
5. Explain the review gate: current reading, training, saved notes, reviewer, current plan. The request is stored; no email is sent.
6. Explain isolation: a random HttpOnly cookie selects a graph; the browser cannot supply a graph name. This is sample isolation, not production authentication.
7. Read agent.py and ui.py. One model call requests fixed graph context; another chooses the supported component order. Graph facts are not invented by the model.
8. Read the evaluation method. Eight authored cases and a simple keyword diagnostic are not a production or same-model RAG benchmark.
9. Explain SPpaths and GRAPH.EXPLAIN. The first runs a path algorithm; the second gives a plan without runtime profiling.
10. Confirm what you contributed: product choices, scope, UI review, verification and corrections. Describe AI assistance truthfully.

Participant completion: PENDING. Record actual manual observations here before submission; do not pre-fill a sign-off.
