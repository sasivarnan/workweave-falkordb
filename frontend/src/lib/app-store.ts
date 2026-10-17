import { createStore } from "@xstate/store"
import type { ImpactAnalysis, ImpactResult } from "./impact"
import type { Evaluation, Result } from "./workspace"

export type AppState = {
  tourReady: number
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
  tourReady: 0,
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
  searchQuery: "",
  evaluation: null,
  evaluationError: false,
  tab: judgeMode ? "proof" : "workspace",
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
