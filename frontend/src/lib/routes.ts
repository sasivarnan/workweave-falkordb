import { readSearchQuery } from "./search-url.ts"

export const viewPaths: Record<string, string> = {
  workspace: "/",
  home: "/tasks",
  changes: "/decisions",
  impact: "/impact",
  calendar: "/calendar",
  notes: "/notes",
  sources: "/knowledge",
  people: "/people",
  proof: "/demo-controls",
  evidence: "/demo-controls/evidence",
}
export function readRoute(pathname = "/", search = "") {
  const query = readSearchQuery(search)
  const match = /^\/(tasks|calendar|knowledge)\/([a-zA-Z0-9_-]{1,100})$/.exec(
    pathname
  )
  if (match)
    return {
      view:
        match[1] === "tasks"
          ? "assignment"
          : match[1] === "calendar"
            ? "calendar"
            : "document",
      query: "",
      assignment: match[1] === "tasks" ? match[2] : "",
      meetingId: match[1] === "calendar" ? match[2] : "",
      sourceId: match[1] === "knowledge" ? match[2] : "",
    }
  return {
    view: query
      ? "sources"
      : Object.keys(viewPaths).find((k) => viewPaths[k] === pathname) ||
        "workspace",
    query,
    assignment: "",
    meetingId: "",
    sourceId: "",
  }
}
