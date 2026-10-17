import assert from "node:assert/strict"
import { test } from "node:test"
import { removalEvidence, restorationVerified } from "../src/lib/proof.ts"
import type { ImpactAnalysis, ImpactItem } from "../src/lib/impact.ts"
const item = (id: string, routeCount: number) =>
  ({ id, routeCount }) as ImpactItem
const baseline: ImpactAnalysis = {
  ready: true,
  decision: {
    id: "approved",
    title: "Decision",
    sourceId: "meeting",
    sourceTitle: "Meeting",
  },
  root: "Service",
  corpusHash: "same-source-hash",
  items: [item("direct", 1), item("removed", 1), item("alternate", 2)],
}
function changed(operation: string): ImpactAnalysis {
  return {
    ...baseline,
    items:
      operation === "remove"
        ? [item("direct", 1), item("alternate", 1)]
        : baseline.items,
    experiment: {
      operation,
      removed: operation === "remove" ? ["removed"] : [],
      added: [],
      retained: [],
      documentsUnchanged: true,
      beforeHash: baseline.corpusHash!,
      afterHash: baseline.corpusHash!,
      beforeRoutes: {},
      afterRoutes: {},
    },
  }
}
test("removal needs unchanged content, a removed task and a retained alternate route", () => {
  const after = changed("remove")
  assert.equal(removalEvidence(baseline, after).verified, true)
  for (const invalid of [
    { ...after, corpusHash: "changed" },
    { ...after, blocked: true },
    { ...after, decision: { ...baseline.decision!, id: "different" } },
    { ...after, items: [item("direct", 1), item("alternate", 2)] },
    { ...after, experiment: { ...after.experiment!, removed: ["wrong"] } },
  ])
    assert.equal(removalEvidence(baseline, invalid).verified, false)
})
test("restoration needs the complete original affected set and route counts", () => {
  const after = changed("restore")
  assert.equal(restorationVerified(baseline, after), true)
  assert.equal(
    restorationVerified(baseline, {
      ...after,
      items: [item("direct", 1), item("removed", 1), item("alternate", 1)],
    }),
    false
  )
  assert.equal(
    restorationVerified(baseline, {
      ...after,
      items: [...after.items!, item("extra", 1)],
    }),
    false
  )
  assert.equal(
    restorationVerified(baseline, {
      ...after,
      experiment: { ...after.experiment!, documentsUnchanged: false },
    }),
    false
  )
})
