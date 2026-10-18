# Workspace API

All responses use the server's same-origin API. Credentials stay on the server. No synthetic company records are embedded in the frontend.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/workspace` | Public startup settings: product name, default assignment, and recording scenario. No provider secrets. |
| POST | `/api/context` | Current graph-backed workspace profile, employee, team, time zone, tasks, meetings, notes, people, sources, and action prerequisites. |
| POST | `/api/person` | Person profile and linked records; accepts `personId`. Returns `{person, trace}`; missing people return 404. |
| POST | `/api/search` | Full-text company document lookup; accepts `query`. |
| POST | `/api/action` | Validated graph action; accepts `name`, optional `note`, and optional `assignment`. Includes saving a workspace note. |
| POST | `/api/agent` | Bounded read-only decision-impact agent with validated graph facts and proposed next steps. Requires a configured provider key and AI not disabled; no user credential header. |
| POST | `/api/impact` | Import the bundled sample, analyze dependencies, or remove/restore the defined test link. |
| POST | `/api/demo/setup` | Reset and prepare Maya’s fixed recording scenario; no AI calls. |
| POST | `/api/reset` | Reset only the visitor's synthetic workspace. |
| GET | `/api/health` | Database reachability and provider configuration status. |
| GET | `/api/access` | Whether AI is enabled for the selected server provider; no key disclosure. |

POST requests require `Content-Type: application/json` and `X-Workweave: portal`. A body may specify an assignment ID received from the server. Omitted or empty assignment values use the server's default. The HttpOnly workspace cookie selects the isolated graph; clients cannot choose a graph name.

Context, search, actions, agent operations, and reset return `{messages, trace, mode}`. `messages` contains the validated A2UI context. The `workspace` property includes company and employee IDs/names, team name/department, time zone, sample-data status, and the server-defined recording scenario. Company identity is read from FalkorDB on each context response. Startup settings and recording scenario definitions live in `src/workweave/workspace.py`.

The UI computes initials and formats server dates. It retains static UI labels and help text. It does not substitute company names, people, tasks, or source records on failure. A missing graph identity causes an error; it does not fall back to a local fixture.

The UI state store holds the latest response, navigation, theme, sidebar mode, drafts, and loading state. Only theme, sidebar preference, and selected assignment ID use local storage. The server-reported AI availability is held only in memory. Users do not enter provider keys or invite codes. Server writes remain in FalkorDB. AI requests have request and concurrency limits, with bounded model calls. There is no persistent usage counter or application spending cap.

This API is for synthetic hackathon workspaces. Employee identity is a server-owned sample, not production authentication or permission enforcement.

See [validation results](../EVALUATION.md) for tests and known gaps.

## Decision review data

`POST /api/context` now includes `context.changeReview`: decision history, affected tasks, meeting/note paths, assignments outside the selected service scope, clarification issues, and `canAcknowledge`.

`POST /api/action` accepts `acknowledge-change` for a version-specific acknowledgement. Synthetic workspace controls also accept `propose` and `replace`. The latter records a sample approver and approval meeting. These controls confer no real company authority. See [the feature contract](DECISION-REVIEW.md).

## Cross-team impact endpoint

`POST /api/impact` accepts `operation`: `import`, `analyze`, `remove`, or `restore`. It reads the same isolated workspace and returns `{analysis, trace}`. The changed service scope and experiment edge are server-owned. It imports only the bundled normalized synthetic fixture. No model calls or vendor account access occur. See [cross-team impact](CROSS-TEAM-IMPACT.md).

The context includes `projectContacts`: graph-derived employee ID, name, description, relationship type, assignment ID and assignment title. People groups these current assignment and service links. It does not infer historical contributions or supply contact channels.

`POST /api/demo/setup` resets only the cookie-selected visitor graph, selects the server-owned checkout scenario, records sample reading/training, saves its initial plan and imports source records. It requires the same portal header and request limits as other writes. It accepts no user-defined scenario, actor or query and makes no AI calls. This fixture control does not authenticate a company approver.

Context also includes `directory`, the workspace’s employee IDs, names and descriptions. Person details include all direct recorded links and tasks connected through a service reviewer role; they do not infer a full history of contributions.

## Work assistant

`POST /api/agent` accepts `prompt` (up to 1,000 characters) and the selected assignment. The model chooses among `get_current_decision`, `inspect_saved_plan`, `find_affected_work` and `find_reviewers`. Tools have no arguments and cannot write. Dependency checks reuse bounded Cypher paths and `algo.SPpaths`.

The response contains `context.agentResult`: question, observed facts with source document IDs, proposed next steps and completed tool names. Company text comes from graph facts, not unchecked model prose. The server rejects unknown fact IDs, repeated tools, missing authority checks and changed evidence. At most five model requests and four distinct tool executions are allowed. Failures consume the reserved operation budget. This is a tool-planning agent with constrained output, not an unrestricted conversational agent.

The docked employee assistant opens from **Ask Workweave** on Task, Decision review and Cross-team impact pages. It uses the selected assignment. Its question and last answer stay in the XState memory store when the sidebar closes. They are not saved to local storage. A workspace refresh marks the retained answer as a previous check; selecting another assignment clears it.
 On desktop it shares the page width without a backdrop. On narrow screens it appears above the page.

Assistant loading and errors stay in the sidebar. A late answer for another assignment is discarded. If the page changes while an answer is pending, the answer is marked as a previous check and does not replace the main page data.
