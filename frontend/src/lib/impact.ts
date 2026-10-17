import type { Result } from "./workspace"
export type ImpactItem = {
  id: string
  title: string
  serviceId: string
  source: string
  service: string
  team: string
  owners: string[]
  paths: string[][]
  explanation: string[]
  algorithm: string
  routeCount: number
  links: (string | null)[][]
}
export type ImpactAnalysis = {
  ready: boolean
  experimentLink?: { from: string; to: string; connected: boolean } | null
  blocked?: boolean
  issues?: string[]
  decision?: {
    id: string
    title: string
    sourceId: string
    sourceTitle: string
  }
  root?: string
  items?: ImpactItem[]
  excluded?: { id: string; title: string; service: string }[]
  unresolved?: string[][]
  unresolvedEvents?: string[][]
  dependencies?: string[][]
  depthLimit?: number
  corpusHash?: string
  synthetic?: boolean
  experiment?: {
    operation: string
    removed: string[]
    added: string[]
    retained: string[]
    documentsUnchanged: boolean
    beforeHash: string
    afterHash: string
    beforeRoutes: Record<string, number>
    afterRoutes: Record<string, number>
  }
}
export type ImpactResult = { analysis: ImpactAnalysis; trace: Result["trace"] }
