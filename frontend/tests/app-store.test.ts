import assert from "node:assert/strict"
import { test } from "node:test"
const persisted = new Map<string, string>()
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => persisted.get(key) || null,
    setItem: (key: string, value: string) => persisted.set(key, value),
  },
})
Object.defineProperty(globalThis, "window", {
  value: {
    location: { pathname: "/" },
    matchMedia: () => ({ matches: false }),
  },
})
const { appStore, updateField } = await import("../src/lib/app-store.ts")

test("sidebar state and request lifecycle do not discard draft state", () => {
  updateField("workspaceNote", "Unsaved question")
  updateField("sidebarOpen", false)
  appStore.trigger.requestStarted()
  assert.equal(appStore.getSnapshot().context.busy, true)
  assert.equal(appStore.getSnapshot().context.sidebarOpen, false)
  assert.equal(appStore.getSnapshot().context.workspaceNote, "Unsaved question")
  appStore.trigger.requestFinished()
  assert.equal(appStore.getSnapshot().context.busy, false)
  updateField("sidebarOpen", (value) => !value)
  assert.equal(appStore.getSnapshot().context.sidebarOpen, true)
})

test("functional updates use the latest snapshot and server AI settings are not persisted", () => {
  updateField("openSources", ["one"])
  updateField("openSources", (sources) => [...sources, "two"])
  assert.deepEqual(appStore.getSnapshot().context.openSources, ["one", "two"])
  updateField("aiEnabled", true)
  assert.equal(persisted.size, 0)
  updateField("aiEnabled", false)
  assert.equal(appStore.getSnapshot().context.aiEnabled, false)
})

const checkedAnswer = {
  question: "What changed?",
  facts: [{ id: "authority", text: "Use Razorpay", sourceIds: ["adr-c"] }],
  nextSteps: ["Read the current source."],
  tools: [{ tool: "get_current_decision", facts: 1 }],
  evidence: {
    component: "GraphEvidence",
    entries: [{ factId: "authority", kind: "decision", paths: [] }],
  },
}

test("closing and reopening the assistant keeps the question and checked answer", () => {
  updateField("prompt", "What changed?")
  appStore.trigger.assistantAnswered({
    assignment: "checkout",
    answer: checkedAnswer,
  })
  updateField("assistantOpen", true)
  updateField("assistantOpen", false)
  updateField("assistantOpen", true)
  assert.equal(appStore.getSnapshot().context.prompt, "What changed?")
  assert.deepEqual(
    appStore.getSnapshot().context.assistantAnswer,
    checkedAnswer
  )
  assert.equal(appStore.getSnapshot().context.assistantOutdated, false)
  assert.equal(persisted.size, 0)
})

test("a workspace refresh marks the retained answer as a previous check", () => {
  appStore.trigger.assistantContextChanged({ assignment: "checkout" })
  assert.deepEqual(
    appStore.getSnapshot().context.assistantAnswer,
    checkedAnswer
  )
  assert.equal(appStore.getSnapshot().context.assistantOutdated, true)
})

test("changing assignments clears the old task answer and draft", () => {
  appStore.trigger.assistantContextChanged({ assignment: "refunds" })
  assert.equal(appStore.getSnapshot().context.assistantAnswer, null)
  assert.equal(appStore.getSnapshot().context.assistantError, "")
  assert.equal(appStore.getSnapshot().context.prompt, "")
})

test("switching tasks also clears a question before its first answer", () => {
  updateField("assistantAssignment", "checkout")
  updateField("prompt", "Question about Checkout")
  appStore.trigger.assistantContextChanged({ assignment: "refunds" })
  assert.equal(appStore.getSnapshot().context.prompt, "")
  assert.equal(appStore.getSnapshot().context.assistantAssignment, "")
})

test("assistant loading does not block page requests or discard its draft", () => {
  updateField("prompt", "Keep this question")
  updateField("assistantWorking", true)
  assert.equal(appStore.getSnapshot().context.busy, false)
  appStore.trigger.requestStarted()
  appStore.trigger.requestFinished()
  assert.equal(appStore.getSnapshot().context.assistantWorking, true)
  assert.equal(appStore.getSnapshot().context.prompt, "Keep this question")
  updateField("assistantWorking", false)
})
