export type AgentResult = {
  question: string
  facts: { id: string; text: string; sourceIds: string[] }[]
  nextSteps: string[]
  tools: { tool: string; facts: number }[]
}

export function validateAgentResult(value: AgentResult, sourceIds: string[]) {
  const toolNames = [
    "get_current_decision",
    "inspect_saved_plan",
    "find_affected_work",
    "find_reviewers",
  ]
  if (
    !value ||
    typeof value.question !== "string" ||
    !Array.isArray(value.facts) ||
    !value.facts.length ||
    value.facts.length > 30 ||
    !Array.isArray(value.nextSteps) ||
    value.nextSteps.length > 3 ||
    !value.nextSteps.every((step) => typeof step === "string") ||
    !Array.isArray(value.tools) ||
    value.tools.length > 4 ||
    !value.tools.every(
      (step) =>
        step &&
        toolNames.includes(step.tool) &&
        Number.isInteger(step.facts) &&
        step.facts >= 0
    ) ||
    !value.facts.every(
      (fact) =>
        fact &&
        typeof fact.id === "string" &&
        typeof fact.text === "string" &&
        Array.isArray(fact.sourceIds) &&
        fact.sourceIds.every((id) => sourceIds.includes(id))
    ) ||
    new Set(value.facts.map((fact) => fact.id)).size !== value.facts.length
  ) {
    throw Error("Invalid work assistant evidence")
  }
  return value
}
