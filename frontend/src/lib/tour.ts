// Instructions describe controls. Company records always come from the server.
export const workspaceTour = [
  {
    target: "today",
    tab: "workspace",
    title: "Your employee workspace",
    description:
      "Today brings together your next meeting, assigned tasks and recent meeting notes. Use it to decide where to start.",
  },
  {
    target: "navigation",
    tab: "workspace",
    title: "Move around the workspace",
    description:
      "Use navigation to open each area. The header control collapses the sidebar or opens navigation on a small screen. The sun or moon control switches the display theme.",
  },
  {
    target: "search",
    tab: "workspace",
    title: "Search company knowledge",
    description:
      "Enter a question or term here to find company documents. Open a result to read the original record. Search does not require paid AI access.",
  },
  {
    target: "tasks",
    tab: "home",
    title: "Find your assigned work",
    description:
      "Tasks lists your assignments and their purpose. Open task shows the requirements, current guidance and saved progress for that assignment.",
  },
  {
    target: "task",
    tab: "assignment",
    title: "Work on an assignment",
    description:
      "This card shows your next required action. Reading, training, plan updates and review requests have separate checks. Saved notes and optional AI help are below. The tour does not complete any action.",
  },
  {
    target: "calendar",
    tab: "calendar",
    title: "Prepare for meetings",
    description:
      "Calendar shows meeting times in your workspace time zone. Open a meeting for its brief and linked notes. These sample records do not send calendar invitations.",
  },
  {
    target: "notes",
    tab: "notes",
    title: "Read and keep notes",
    description:
      "Expand saved meeting notes to read the record. Use the workspace note area for your own note. Saving is an explicit action; the tour does not write a note.",
  },
  {
    target: "knowledge",
    tab: "sources",
    title: "Read company sources",
    description:
      "Knowledge contains documents and decision sources. Search or expand a record to read it. Source links elsewhere in the app bring you here so you can check the original evidence.",
  },
  {
    target: "people",
    tab: "people",
    title: "Find the right person",
    description:
      "People shows contacts linked to your current assignment, including their recorded role. It is assignment context, not a full company directory.",
  },
  {
    target: "decision",
    tab: "changes",
    title: "Check current guidance",
    description:
      "Decision review shows approval, source, history and affected assignments. Acknowledge records that you read the change. Updating a saved plan is a separate action.",
  },
  {
    target: "impact",
    tab: "impact",
    title: "Explore cross-team dependencies",
    description:
      "Find affected work follows recorded service links to tasks, owners, meetings and notes. Why affected explains each path. Missing links can hide impact. The labelled sample import is optional; this tour does not run it.",
  },
] as const
