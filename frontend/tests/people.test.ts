import assert from "node:assert/strict"
import { test } from "node:test"
import { decodePerson } from "../src/lib/people.ts"

test("person responses validate linked records and internal URLs", () => {
  const person = {
    id: "leo",
    name: "Leo Martin",
    description: "Reviewer",
    items: [
      {
        id: "checkout",
        title: "Checkout",
        kind: "Tasks",
        relation: "Reviews work",
        description: "",
        url: "/tasks/checkout",
      },
    ],
  }
  assert.equal(decodePerson({ person }).items[0].url, "/tasks/checkout")
  for (const url of ["javascript:alert(1)", "//other.example/path"]) {
    assert.throws(() =>
      decodePerson({
        person: { ...person, items: [{ ...person.items[0], url }] },
      })
    )
  }
  assert.throws(() => decodePerson({ person: { ...person, items: [{}] } }))
})
