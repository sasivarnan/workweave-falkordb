# Release status — 17 October 2026

## Ready locally

- Judge entry: /judge, with a three-step dependency proof.
- Real server queries and FalkorDB path analysis; synthetic records are labelled.
- Browser check: link removal changes the affected set, alternate paths remain, restoration matches task IDs and route counts. Source content hashes remain equal.
- Frontend: four tests, production build and configured-secret scan passed.
- Previous backend validation: 60 tests, seven impact cases, four relationship cases and eight graph retrieval cases passed. These were not repeated for this UI-only change.
- Changes committed locally. A local commit is not proof of public CI or deployment.

- Optional home guide added: current decision → cross-team impact → assigned task. Skip/finish saves dismissal locally; Help restarts it. Local browser check covered all three steps, finish and restart. This is not independent human feedback.

## Submission blockers

- Registration confirmation: pending participant confirmation.
- Independent first-use feedback: pending. Participant technical review: pending.
- Hosting account and public HTTPS URL: pending. Publish last, as requested.
- Persistent graph and AI usage storage, host restart check and paid AI controls on the host: pending.
- Final video, blog review and submission links: pending.

## Final sequence

1. Complete participant review and first-use test; fix reported problems.
2. Review submission text and blog against HACKATHON-AUDIT.md. State AI assistance and synthetic integrations accurately.
3. Choose hosting, deploy and verify HTTPS, persistent storage and AI access limits.
4. Record the public demo, update links and submit to Company Brain.

No award or acceptance is guaranteed. No claim that this problem is impossible without a graph database is made.

## Tour overlay update

The employee guide uses the official shadcn Popover, with a dimmed page and a highlighted existing Card. XState controls each step. Tailwind classes control the layout. The browser check covered three steps, Back and Escape with focus returned to Help. Skip and finish keep the existing local dismissal behaviour. The guide does not approve decisions or update saved plans.

The home page now has a permanent Start tour button. The dismissible welcome card and its obsolete dismissal flag were removed. Start → Skip → Today was checked in the browser; Start tour remains available.

## Full employee application tour

The header Start tour button now opens 11 stops: Today, navigation and display controls, search, task list, task detail, calendar, notes, knowledge, people, decision review and cross-team impact. This replaces the earlier three-step workflow guide. Each stop highlights its own existing control or introduction. The tour does not import sample exports, run AI, accept plans, acknowledge decisions or save notes. Judge proof tools remain a separate experience.

Browser validation covered all 11 forward stops, cross-page Back navigation and the header search spotlight. Four frontend tests, production build and configured-secret scan passed. Independent human feedback is still pending.
