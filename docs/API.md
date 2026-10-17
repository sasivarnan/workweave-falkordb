# Workspace API

All responses use the server's same-origin API. Credentials stay on the server. No synthetic company records are embedded in the frontend.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/workspace` | Public startup settings: product name, default assignment, and demonstration workflow. No provider secrets or invite code. |
| POST | `/api/context` | Current graph-backed workspace profile, employee, team, time zone, tasks, meetings, notes, people, sources, and action prerequisites. |
| POST | `/api/search` | Full-text company document lookup; accepts `query`. |
| POST | `/api/action` | Validated graph action; accepts `name`, optional `note`, and optional `assignment`. Includes saving a workspace note. |
| POST | `/api/agent` | Protected provider tool call and allowlisted layout selection; requires `X-AI-Access`. |
| POST | `/api/reset` | Reset only the visitor's synthetic workspace. |
| GET | `/api/health` | Database reachability and provider configuration status. |
| GET | `/api/access` | Whether protected AI access is configured; no code disclosure. |

POST requests require `Content-Type: application/json` and `X-Workweave: portal`. A body may specify an assignment ID received from the server. Omitted or empty assignment values use the server's default. The HttpOnly workspace cookie selects the isolated graph; clients cannot choose a graph name.

Context, search, actions, agent operations, and reset return `{messages, trace, mode}`. `messages` contains the validated A2UI context. The `workspace` property includes company and employee IDs/names, team name/department, time zone, sample-data status, and the server-defined walkthrough. Company identity is read from FalkorDB on each context response. Startup settings and sample workflow definitions live in `workspace.py`.

The UI computes initials and formats server dates. It retains static UI labels and help text. It does not substitute company names, people, tasks, or source records on failure. A missing graph identity causes an error; it does not fall back to a local fixture.

The UI state store holds the latest response, navigation, theme, sidebar mode, drafts, and loading state. Only theme, sidebar preference, and selected assignment ID use local storage. The AI invite code stays in store memory and is cleared after authorization failure or the user's clear action. Server writes remain in FalkorDB and the AI budget remains in server-side SQLite.

This API is for synthetic hackathon workspaces. Employee identity is a server-owned sample, not production authentication or permission enforcement.

Checks: 47 server/graph tests and two frontend store tests pass. The frontend source contains no sample company/person names or fixture assignment IDs. Browser checks cover collapse, expansion, saved mode after reload, and server-backed meeting details.

## Decision review data

`POST /api/context` now includes `context.changeReview`: decision history, affected tasks, meeting/note paths, assignments outside the selected service scope, clarification issues, and `canAcknowledge`.

`POST /api/action` accepts `acknowledge-change` for a version-specific acknowledgement. Synthetic workspace controls also accept `propose` and `replace`. The latter records a sample approver and approval meeting. These controls confer no real company authority. See [the feature contract](DECISION-REVIEW.md).
