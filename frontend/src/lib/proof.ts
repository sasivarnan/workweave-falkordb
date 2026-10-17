import type { ImpactAnalysis } from "./impact"
const ids = (analysis: ImpactAnalysis) =>
  (analysis.items || []).map((item) => item.id).sort()
const equal = (left: string[], right: string[]) =>
  JSON.stringify(left) === JSON.stringify(right)
const sameScope = (before: ImpactAnalysis, after: ImpactAnalysis) =>
  Boolean(
    before.ready &&
    after.ready &&
    !before.blocked &&
    !after.blocked &&
    before.decision?.id &&
    before.decision.id === after.decision?.id &&
    before.root === after.root
  )
const sameContent = (before: ImpactAnalysis, after: ImpactAnalysis) =>
  Boolean(
    before.corpusHash &&
    before.corpusHash === after.corpusHash &&
    after.experiment?.documentsUnchanged &&
    after.experiment.beforeHash === before.corpusHash &&
    after.experiment.afterHash === after.corpusHash
  )
export function removalEvidence(before: ImpactAnalysis, after: ImpactAnalysis) {
  const current = new Map((after.items || []).map((item) => [item.id, item]))
  const removed = ids(before).filter((id) => !current.has(id))
  const alternate = (before.items || [])
    .filter(
      (item) =>
        item.routeCount > 1 &&
        current.has(item.id) &&
        current.get(item.id)!.routeCount > 0 &&
        current.get(item.id)!.routeCount < item.routeCount
    )
    .map((item) => item.id)
  return {
    verified:
      sameScope(before, after) &&
      sameContent(before, after) &&
      after.experiment?.operation === "remove" &&
      removed.length > 0 &&
      alternate.length > 0 &&
      equal([...removed].sort(), [...(after.experiment?.removed || [])].sort()),
    removed,
    alternate,
  }
}
export function restorationVerified(
  before: ImpactAnalysis,
  after: ImpactAnalysis
) {
  return (
    sameScope(before, after) &&
    sameContent(before, after) &&
    after.experiment?.operation === "restore" &&
    equal(ids(before), ids(after)) &&
    (before.items || []).every((item) =>
      after.items?.some(
        (current) =>
          current.id === item.id && current.routeCount === item.routeCount
      )
    )
  )
}
