export type PersonProfile = {
  id: string
  name: string
  description: string
  items: {
    id: string
    title: string
    kind: string
    relation: string
    description: string
    url: string | null
  }[]
}
export function decodePerson(value: unknown): PersonProfile {
  const person = (value as { person?: PersonProfile })?.person
  if (
    !person ||
    ![person.id, person.name, person.description].every(
      (v) => typeof v === "string"
    ) ||
    !Array.isArray(person.items) ||
    !person.items.every(
      (item) =>
        [item.id, item.title, item.kind, item.relation, item.description].every(
          (v) => typeof v === "string"
        ) &&
        (item.url === null ||
          (typeof item.url === "string" &&
            item.url.startsWith("/") &&
            !item.url.startsWith("//")))
    )
  )
    throw Error("Person details are unavailable")
  return person
}
