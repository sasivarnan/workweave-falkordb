// Instructions describe controls; company records always come from the server.
export const workspaceTour = [
  {
    target: "home-up-next",
    title: "Prepare for your next meeting",
    description:
      "Open the meeting brief for its purpose. Connected context links the meeting to its note and related task.",
  },
  {
    target: "home-tasks",
    title: "Start with your assigned work",
    description:
      "Open a task to see its next action, current guidance, saved notes and reviewer. View all tasks opens your assignment list.",
  },
  {
    target: "home-schedule",
    title: "Plan your day",
    description:
      "Select a meeting to open its brief. Times use your workspace time zone. View calendar opens the full meeting list.",
  },
  {
    target: "home-notes",
    title: "Find meeting context",
    description:
      "Open a linked note to read the record behind a meeting. The Notes area also lets you keep a workspace note.",
  },
  {
    target: "search",
    title: "Search company knowledge",
    description:
      "Search documents from any page, then open the original source. Search does not use paid AI credits.",
  },
  {
    target: "left-nav",
    title: "Your workspace navigation",
    description:
      "Today brings you back here. Tasks opens assigned work; Calendar, Notes and Knowledge hold meeting records and sources. People shows contacts for your current assignment.",
  },
  {
    target: "nav-changes",
    title: "Review changed decisions",
    description:
      "Decision review shows approval, original sources and saved plans that need review. Reading a change and updating a plan are separate actions.",
  },
  {
    target: "nav-impact",
    title: "Follow work across teams",
    description:
      "Cross-team impact follows service dependencies to affected tasks and owners. Why affected shows the paths. Sample exports are labelled and load only when requested.",
  },
  {
    target: "theme",
    title: "Make the workspace comfortable",
    description:
      "Switch light and dark mode here. Your choice is saved in this browser. You can restart this tour from the header at any time.",
  },
] as const
