export function readSearchQuery(search = "") {
  return (new URLSearchParams(search).get("q") || "").trim().slice(0, 200)
}

export function searchURL(href: string, query: string) {
  const url = new URL(href)
  const value = query.trim().slice(0, 200)
  if (value) url.searchParams.set("q", value)
  else url.searchParams.delete("q")
  return url.href
}
