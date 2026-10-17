export type Context = {
  workspace: {
    appName: string
    company: { id: string; name: string }
    employee: { id: string; name: string }
    team: { id: string; name: string; department: string }
    timezone: string
    synthetic: boolean
    demo: {
      assignment: string
      steps: { label: string; path: string; body: Record<string, unknown> }[]
    }
  }
  meetings: string[][]
  notes: string[][]
  impact: string[][]
  searchResults?: [string, string, string, number][]
  reviewRequest: string[][]
  findings: string[][]
  week: [number, string, string, string, string][]
  colleagues: string[][]
  assignment: string
  assignments: string[][]
  guidanceRead: boolean
  task: string[][]
  people: string[][]
  decisions: (string | null)[][]
  conflicts: [string, string, string, string, string, string[]][]
  training: [string, string, boolean][]
  plan: string[][]
  paths: string[][][]
  sources: string[][]
  current: string | null
  needsReview: boolean
  ambiguous: boolean
  direct: string[][]
  connected: string[][]
}
type Component = {
  id: string
  component: string
  children?: string[]
  data?: { path: string }
}
type Message = {
  version: string
  createSurface?: { surfaceId: string; catalogId: string }
  updateComponents?: { surfaceId: string; components: Component[] }
  updateDataModel?: {
    surfaceId: string
    path: string
    value: { context: Context }
  }
}
type TraceRecord = {
  tool: string
  query: string
  arguments: Record<string, unknown>
  rows: number
  ms: number
  executionPlan?: string
}
export type Evaluation = {
  relationshipDiagnostic?: {
    method: string
    claim: string
    results: {
      case: string
      before: string
      after: string
      documentsUnchanged: boolean
      passed: boolean
      query: string
    }[]
  }
  modelDiagnostic?: {
    model: string
    method: string
    results: {
      case: string
      documents: { correct: boolean; citationsExist: boolean }
      graph: { correct: boolean; citationsExist: boolean }
    }[]
  }
  method: string
  dataset: string
  limitations: string[]
  results: {
    case: string
    expected: string | null
    graph: string | null
    lexical: string | null
    lexicalSource: string
    passed: boolean
    lexicalPassed: boolean
    ms: number
    detail: string
  }[]
}
export type Result = { messages: Message[]; trace: TraceRecord[]; mode: string }
const kinds = [
  "SummaryCard",
  "EvidenceComparison",
  "PersonCard",
  "Checklist",
  "ProgressCard",
  "QuestionForm",
]
export function decode(result: Result) {
  const m = result.messages
  if (
    !Array.isArray(m) ||
    m.length !== 3 ||
    m.some((x) => x.version !== "v0.9") ||
    m[0].createSurface?.catalogId !== "urn:workweave:catalog:v1"
  )
    throw Error("Unsupported A2UI messages")
  const components = m[1].updateComponents?.components,
    context = m[2].updateDataModel?.value.context
  if (
    !components ||
    !context ||
    components[0]?.id !== "root" ||
    components[0]?.component !== "Column"
  )
    throw Error("Invalid A2UI surface")
  const profile=context.workspace
  if(!profile || !profile.company || !profile.employee || !profile.team ||
     ![profile.appName,profile.company.name,profile.employee.name,profile.team.name,profile.timezone].every(value=>typeof value==='string'&&value.length>0) ||
     !profile.demo || !Array.isArray(profile.demo.steps))throw Error('Invalid workspace identity')
  try { new Intl.DateTimeFormat('en',{timeZone:profile.timezone}) } catch { throw Error('Invalid workspace time zone') }
  const order = components[0].children
  if (
    !order ||
    order.length > 6 ||
    new Set(order).size !== order.length ||
    components.length !== order.length + 1
  )
    throw Error("Invalid A2UI component tree")
  const byId = new Map(components.slice(1).map((x) => [x.id, x]))
  for (const id of order) {
    const c = byId.get(id)
    if (!c || !kinds.includes(c.component) || c.data?.path !== "/context")
      throw Error("Unsupported A2UI component")
  }
  return { context, order: order.map((id) => byId.get(id)!.component) }
}
