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

test("functional updates use the latest snapshot and invite codes remain in memory", () => {
  updateField("openSources", ["one"])
  updateField("openSources", (sources) => [...sources, "two"])
  assert.deepEqual(appStore.getSnapshot().context.openSources, ["one", "two"])
  updateField("aiCode", "synthetic-test-invite")
  assert.equal(persisted.size, 0)
  updateField("aiCode", "")
  assert.equal(appStore.getSnapshot().context.aiCode, "")
})
