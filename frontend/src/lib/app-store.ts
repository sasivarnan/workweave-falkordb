import { readSearchQuery } from "./search-url.ts"
import { createStore } from "@xstate/store"
import type { ImpactAnalysis, ImpactResult } from "./impact"
import type { Evaluation, Result } from "./workspace"

export type AppState = {
  tourSidebarBefore: boolean | null
  employeeGuide: number
  proofStage: "off" | "inspect" | "removed" | "restored"
  proofBaseline: ImpactAnalysis | null
  impactExpanded: string[]
  impact: ImpactResult | null
  theme: string
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  meeting: string[] | null
  workspaceNote: string
  assignment: string
  result: Result | null
  error: string
  busy: boolean
  readingOpen: boolean
  editingNotes: boolean
  aiCode: string
  searchNavigation: { query: string; view: string; revision: number } | null
  searchQuery: string
  evaluation: Evaluation | null
  evaluationError: boolean
  tab: string
  prompt: string
  note: string
  demoStep: number
  demoLabel: string
  playing: boolean
  openSources: string[]
}
const judgeMode = window.location.pathname === "/judge"
const initial: AppState = {
  tourSidebarBefore: null,
  employeeGuide: 0,
  proofStage: "off",
  proofBaseline: null,
  impactExpanded: [],
  impact: null,
  theme:
    localStorage.getItem("workweave-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"),
  sidebarOpen: localStorage.getItem("workweave-sidebar") !== "collapsed",
  mobileSidebarOpen: false,
  meeting: null,
  workspaceNote: "",
  assignment: judgeMode
    ? ""
    : localStorage.getItem("workweave-assignment") || "",
  result: null,
  error: "",
  busy: false,
  readingOpen: false,
  editingNotes: false,
  aiCode: "",
  searchQuery: readSearchQuery(window.location.search),
  searchNavigation: readSearchQuery(window.location.search)
    ? {
        query: readSearchQuery(window.location.search),
        view: "sources",
        revision: 0,
      }
    : null,
  evaluation: null,
  evaluationError: false,
  tab: readSearchQuery(window.location.search)
    ? "sources"
    : judgeMode
      ? "proof"
      : "workspace",
  prompt: "",
  note: "",
  demoStep: 0,
  demoLabel: "",
  playing: false,
  openSources: [],
}
export const appStore = createStore({
  context: initial,
  on: {
    requestStarted: (context) => ({ ...context, busy: true, error: "" }),
    requestFinished: (context) => ({ ...context, busy: false }),
    updated: (context, event: { patch: Partial<AppState> }) => ({
      ...context,
      ...event.patch,
    }),
  },
})
export function updateField<K extends keyof AppState>(
  key: K,
  value: AppState[K] | ((previous: AppState[K]) => AppState[K])
) {
  const next =
    typeof value === "function"
      ? value(appStore.getSnapshot().context[key])
      : value
  appStore.trigger.updated({ patch: { [key]: next } })
}
