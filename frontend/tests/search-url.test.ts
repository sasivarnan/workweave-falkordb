import assert from "node:assert/strict"
import { test } from "node:test"
import { readSearchQuery, searchURL } from "../src/lib/search-url.ts"

test("search round-trips spaces, symbols and unicode without changing other URL fields", () => {
  const query = "approval & café / team?"
  const url = new URL(
    searchURL("http://localhost:5173/demo-controls?source=demo#evidence", query)
  )
  assert.equal(readSearchQuery(url.search), query)
  assert.equal(url.pathname, "/demo-controls")
  assert.equal(url.searchParams.get("source"), "demo")
  assert.equal(url.hash, "#evidence")
})
test("clearing search removes q and input length stays bounded", () => {
  const url = new URL(
    searchURL("http://localhost:5173/?q=old&source=demo", "   ")
  )
  assert.equal(url.searchParams.has("q"), false)
  assert.equal(url.searchParams.get("source"), "demo")
  assert.equal(readSearchQuery("?q=" + "x".repeat(250)).length, 200)
  assert.equal(readSearchQuery(), "")
})
