import assert from "node:assert/strict"
import { test } from "node:test"
import { validateAgentResult } from "../src/lib/agent.ts"

const answer = {
  question: "What changed?",
  facts: [{ id: "authority", text: "Use Razorpay", sourceIds: ["adr"] }],
  nextSteps: ["Read the source."],
  tools: [{ tool: "get_current_decision", facts: 1 }],
  evidence: {
    component: "GraphEvidence",
    entries: [{ factId: "authority", kind: "decision", paths: [] }],
  },
}
test("assistant evidence accepts known source IDs and read-only tools", () => {
  assert.equal(validateAgentResult(answer, ["adr"]), answer)
})
test("assistant evidence rejects invented sources, repeated facts and write tools", () => {
  assert.throws(() => validateAgentResult(answer, []))
  assert.throws(() =>
    validateAgentResult(
      { ...answer, facts: [...answer.facts, ...answer.facts] },
      ["adr"]
    )
  )
  assert.throws(() =>
    validateAgentResult(
      { ...answer, tools: [{ tool: "delete_graph", facts: 1 }] },
      ["adr"]
    )
  )
})

test("graph evidence rejects unknown facts, duplicate bindings and invalid paths", () => {
  for (const evidence of [
    { component: "Script", entries: answer.evidence.entries },
    {
      component: "GraphEvidence",
      entries: [{ factId: "invented", kind: "impact", paths: [] }],
    },
    {
      component: "GraphEvidence",
      entries: [...answer.evidence.entries, ...answer.evidence.entries],
    },
    {
      component: "GraphEvidence",
      entries: [
        { factId: "authority", kind: "decision", paths: [["Invented path"]] },
      ],
    },
    {
      component: "GraphEvidence",
      entries: [{ factId: "authority", kind: "decision", paths: [null] }],
    },
  ]) {
    assert.throws(() =>
      validateAgentResult({ ...answer, evidence } as typeof answer, ["adr"])
    )
  }
})
test("graph evidence preserves server route counts without an extra model result", () => {
  const value = {
    ...answer,
    facts: [
      ...answer.facts,
      { id: "work:SUP-310", text: "Support", sourceIds: [] },
    ],
    evidence: {
      component: "GraphEvidence",
      entries: [
        ...answer.evidence.entries,
        {
          factId: "work:SUP-310",
          kind: "impact",
          paths: [
            ["Support", "Billing", "Checkout"],
            ["Support", "Checkout"],
          ],
        },
      ],
    },
  }
  assert.equal(
    validateAgentResult(value, ["adr"]).evidence.entries[1].paths.length,
    2
  )
})
