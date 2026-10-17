# Company workspace direction

The four-hour constraint is removed. Target a coherent company workspace, not a collection of disconnected widgets. Keep deployment last.

## Product contract

An employee can open a task, meeting, note, project or policy and find its related work, recorded owner, current decisions and original sources. The next action remains focused even when the workspace has many modules.

The flagship question is: “This decision changed. Which tasks, meetings and notes need review, and who is responsible?”

Current implementation: Calendar records connect to tasks, services and the decision considered for the meeting. Meeting notes connect to the meeting. A current replacement decision is followed through those links to produce an impact list. The task resolves its recorded reviewer. No owner is inferred when its link is absent.

## What exists now

- Overview with assigned tasks, a next meeting and a relationship-backed change alert.
- Calendar agenda with related task and exact meeting-note links.
- Meeting notes and one editable personal workspace note, persisted in FalkorDB.
- Focused task flow with evidence-gated review requests.
- Full-text company knowledge lookup, including a synthetic HR policy.
- Assignment-related people view.
- Light/dark toggle with saved preference and system default.
- Protected optional AI layout selection, graph evidence and reproducible checks.

## What is not complete

This is a first company-workspace implementation. It is not yet an all-use-case production portal. Calendar sync, event editing, full note CRUD, transcription, general company question answering, multiple employee identities, permissions, projects detail pages and source ingestion remain work.

## Next implementation order

1. Create a shared record detail view: content, owner, source and linked records. Keep one consistent interaction across modules.
2. Expand company questions through typed graph tools. Return evidence paths and explicit missing-information states. The current AI adapter selects layout; do not advertise it as a general company assistant.
3. Add employee identity and permission-aware graph queries before any real company deployment.
4. Add versioned ingestion and reviewed authority links. Meeting text alone must not mark a decision approved.
5. Add calendars and notes through user-authorized connectors only. During the hackathon use public or synthetic data as required by the rules.
6. Measure cross-domain questions with independent expected answers. Keep failure cases and small-dataset limits visible.
7. Finish visual, keyboard, mobile and failure-state review; deploy last; record the final video.

## Defensible database claim

Identical documents with different relationships require different outcomes. Text alone cannot distinguish those states. FalkorDB stores and traverses the operational relationships and makes them central to this implementation. This is not proof that another database cannot represent the same information. Never claim impossibility merely to strengthen the pitch.
