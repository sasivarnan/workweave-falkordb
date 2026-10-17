# Workspace redesign

The approved image concept guides the daily workspace. All visible UI controls use the existing official shadcn components and Remix icons from its preset. Layout, spacing, borders, typography, responsive behavior, and view-transition settings use Tailwind classes.

`frontend/src/index.css` contains only framework/font imports, the dark variant, and shadcn theme tokens. It has no custom layout selectors, animation rules, or keyframes. Official Sidebar internals retain their generated CSS-variable styles.

## Changes

- Today shows the next meeting, assigned tasks, schedule, and linked meeting notes.
- A shadcn Sheet opens meeting details and the actual linked task and note.
- Connected context stays collapsed until requested.
- Header search uses the existing FalkorDB full-text search endpoint.
- Calendar and Notes follow the same spacing and hierarchy.
- Light and dark themes persist locally. Navigation keeps native view transitions and the reduced-motion fallback.
- The graph, action checks, AI access gate, and judge evidence view remain intact.

The image contains example tasks, dates, and controls. The app uses stored synthetic records. It does not add non-working Team tabs, project links, notifications, or recent-use timestamps from the image.

## Cleanup

- Removed unused Native Select and utility re-export files.
- Removed custom view-transition CSS and keyframes; use Tailwind utilities and the browser transition.
- Moved A2UI types and validation into `src/lib/workspace.ts`.
- Formatted the rewritten application for review.

## Validation

- Production frontend build passed.
- All 33 existing graph/API tests passed.
- Browser checks passed: Today, Calendar, Notes, meeting Sheet, meeting-note link, company search, and task gate view.
- Light and dark mode checked in the local browser.
- Secret scan passed. No live AI request was needed for this redesign.
- Narrow mobile viewport and a full keyboard audit remain release checks.

The application remains local. No hosting deployment was made.
