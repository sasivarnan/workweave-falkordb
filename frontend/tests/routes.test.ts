import assert from "node:assert/strict"
import { test } from "node:test"
import { readRoute, viewPaths } from "../src/lib/routes.ts"

test("record links restore the record type and ID", () => {
  assert.equal(readRoute("/tasks/checkout").assignment, "checkout")
  assert.equal(readRoute("/tasks/refunds").view, "assignment")
  assert.equal(
    readRoute("/calendar/release-review").meetingId,
    "release-review"
  )
  assert.equal(readRoute("/knowledge/adr").sourceId, "adr")
  assert.equal(readRoute("/knowledge/adr").view, "document")
  assert.equal(readRoute("/knowledge/adr", "?q=old").query, "")
})
test("section links round trip and search retains its query", () => {
  for (const [view, path] of Object.entries(viewPaths))
    assert.equal(readRoute(path).view, view)
  assert.equal(
    readRoute("/knowledge", "?q=payment%20status").query,
    "payment status"
  )
  assert.equal(readRoute("/tasks/not/a/record").assignment, "")
})

test("task people links keep the task behind the panel", () => {
  const route = readRoute("/tasks/checkout/people")
  assert.equal(route.view, "assignment")
  assert.equal(route.assignment, "checkout")
  assert.equal(route.peopleTask, "checkout")
  assert.equal(readRoute("/tasks/refunds/people").peopleTask, "refunds")
  assert.equal(readRoute("/people").peopleTask, "")
})

test("person links select the detail page", () => {
  assert.equal(readRoute("/people/leo").view, "person")
  assert.equal(readRoute("/people/leo").personId, "leo")
  assert.equal(readRoute("/people/leo/extra").view, "workspace")
})
