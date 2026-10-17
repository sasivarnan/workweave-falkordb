import assert from "node:assert/strict"
import { test } from "node:test"
import { validateAgentResult } from "../src/lib/agent.ts"

const answer = {
  question: "What changed?",
  facts: [{ id: "authority", text: "Use Razorpay", sourceIds: ["adr"] }],
  nextSteps: ["Read the source."],
  tools: [{ tool: "get_current_decision", facts: 1 }],
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
