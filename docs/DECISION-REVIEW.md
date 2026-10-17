# Decision change review

The employee can open Decision review from the workspace navigation and choose an assigned task. All records come from the server and FalkorDB. Local navigation remains in XState Store; visible controls use shadcn and Tailwind.

## What is shown

- Current approved, source-backed decision, service scope, recorded approver, effective time, approval meeting, and original source.
- Assigned tasks connected through the same service, their recorded owners, and an explanation path.
- Original saved notes and their decision version. A changed version makes the plan stale without rewriting its content.
- Meetings that considered a replaced decision, and notes linked to those meetings.
- Assignments connected to other services, marked outside this decision's scope.
- Decision history, with proposals distinct from approvals.

## Review action

`POST /api/action` with `name: acknowledge-change` records the current sample employee's acknowledgement for the selected assignment and exact decision ID. It creates a DecisionReview receipt with a server timestamp, linked to the employee, assignment, and decision. Repeating the action keeps the first receipt. A later replacement requires a new acknowledgement. Original receipts remain stored.

Acknowledgement also records reading of that decision. It does not update or approve the employee's saved plan. Updating the plan requires a separate explicit task action. Missing source, conflicting approval, missing/unclear approver, missing effective time, or a future effective time blocks acknowledgement and task acceptance.

## Demonstration

1. Open a task, read the current source, record synthetic training completion, and save review notes.
2. Open Decision review and expand the sample-change controls.
3. Approve the sample replacement. The plan becomes stale; the related meeting and notes need review; the unrelated refund task stays outside scope.
4. Add a newer proposal. It appears in history while the approved replacement remains current.
5. Acknowledge current guidance. The receipt is saved, while the old plan remains stale.
6. Open the task and explicitly accept the updated guidance to revise the plan's decision version.

The guided judge walkthrough also includes the proposal and acknowledgement actions. It performs graph operations without AI calls.

## Proof and limits

47 server/graph tests and two store tests pass. The checks include version-specific acknowledgement, idempotency, preserved notes, unaffected assignment scope, proposal-only meetings, missing sources, missing approvers, conflicting decisions, and future-date blocking. Existing four relationship checks and eight retrieval diagnostic cases still pass.

The graph links are curated synthetic data. Approval controls are explicitly sample controls, not a production authorization system. Jira, Google Calendar, and Zoom connectors, production identities and permission checks, automatic decision extraction, general decision editing, and scheduled replacement routing remain unimplemented. Future-effective decisions cause conservative clarification; the system does not route to the earlier decision until a scheduled activation. Receipt history is persistent sample data, not a tamper-proof audit ledger. Impact is only as complete as the recorded links.
