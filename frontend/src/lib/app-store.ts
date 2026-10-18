import type { AgentResult } from "./agent"
import { readRoute } from "./routes.ts"
import { readSearchQuery } from "./search-url.ts"
import type { PersonProfile } from "./people"
import { createStore } from "@xstate/store"
import type { ImpactAnalysis, ImpactResult } from "./impact"
import type { Evaluation, Result } from "./workspace"

export type AppState = {
  tourSidebarBefore: boolean | null
  employeeGuide: number
  storyPrepared: boolean
  proofStage: "off" | "inspect" | "removed" | "restored"
  proofBaseline: ImpactAnalysis | null
  impactExpanded: string[]
  impact: ImpactResult | null
  theme: string
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  personProfile: PersonProfile | null
  peopleTask: string | null
  meeting: string[] | null
  workspaceNote: string
  assignment: string
  result: Result | null
  error: string
  busy: boolean
  readingOpen: boolean
  editingNotes: boolean
  assistantWorking: boolean
  assistantOpen: boolean
  assistantMessages: { id: number; answer: AgentResult; outdated: boolean }[]
  assistantSequence: number
  assistantPendingQuestion: string
  assistantAssignment: string
  assistantError: string
  aiEnabled: boolean
  searchNavigation: {
    query: string
    view: string
    revision: number
    assignment?: string
    meetingId?: string
    sourceId?: string
    personId?: string
  } | null
  searchQuery: string
  evaluation: Evaluation | null
  evaluationError: boolean
  tab: string
  prompt: string
  note: string
  openSources: string[]
}
const judgeMode = window.location.pathname.startsWith("/demo-controls")
const initialRoute = readRoute(window.location.pathname, window.location.search)
const initial: AppState = {
  tourSidebarBefore: null,
  employeeGuide: 0,
  storyPrepared: false,
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
  personProfile: null,
  peopleTask: initialRoute.peopleTask || null,
  meeting: null,
  workspaceNote: "",
  assignment:
    initialRoute.assignment ||
    (judgeMode ? "" : localStorage.getItem("workweave-assignment") || ""),
  result: null,
  error: "",
  busy: false,
  readingOpen: false,
  editingNotes: false,
  assistantWorking: false,
  assistantOpen: false,
  assistantMessages: [],
  assistantSequence: 0,
  assistantPendingQuestion: "",
  assistantAssignment: "",
  assistantError: "",
  aiEnabled: false,
  searchQuery: readSearchQuery(window.location.search),
  searchNavigation: { ...initialRoute, revision: 0 },
  evaluation: null,
  evaluationError: false,
  tab: initialRoute.view,
  prompt: "",
  note: "",
  openSources: [],
}
export const appStore = createStore({
  context: initial,
  on: {
    assistantAnswered: (
      context,
      event: { assignment: string; answer: AgentResult }
    ) => ({
      ...context,
      assistantMessages: [
        ...context.assistantMessages,
        {
          id: context.assistantSequence + 1,
          answer: event.answer,
          outdated: false,
        },
      ].slice(-6),
      assistantPendingQuestion: "",
      assistantAssignment: event.assignment,
      assistantSequence: context.assistantSequence + 1,
      assistantError: "",
    }),
    assistantContextChanged: (context, event: { assignment: string }) => {
      if (
        context.assistantAssignment &&
        context.assistantAssignment !== event.assignment
      )
        return {
          ...context,
          assistantMessages: [],
          assistantPendingQuestion: "",
          assistantAssignment: "",
          assistantError: "",
          prompt: "",
        }
      return {
        ...context,
        assistantMessages: context.assistantMessages.map((message) => ({
          ...message,
          outdated: true,
        })),
      }
    },
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
