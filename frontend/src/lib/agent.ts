export type AgentResult = {
  question: string
  facts: { id: string; text: string; sourceIds: string[] }[]
  nextSteps: string[]
  tools: { tool: string; facts: number }[]
  evidence: {
    component: string
    entries: { factId: string; kind: string; paths: string[][] }[]
  }
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
    new Set(value.facts.map((fact) => fact.id)).size !== value.facts.length ||
    value.evidence?.component !== "GraphEvidence" ||
    !Array.isArray(value.evidence.entries) ||
    value.evidence.entries.length !== value.facts.length ||
    new Set(value.evidence.entries.map((entry) => entry.factId)).size !==
      value.facts.length ||
    !value.evidence.entries.every(
      (entry) =>
        entry &&
        value.facts.some((fact) => fact.id === entry.factId) &&
        ["decision", "plan", "reviewer", "impact"].includes(entry.kind) &&
        Array.isArray(entry.paths) &&
        entry.paths.length <= 100 &&
        (entry.paths.length === 0 ||
          (entry.kind === "impact" && entry.factId.startsWith("work:"))) &&
        entry.paths.every(
          (path) =>
            Array.isArray(path) &&
            path.length > 0 &&
            path.length <= 6 &&
            path.every(
              (node) =>
                typeof node === "string" &&
                node.length > 0 &&
                node.length <= 500
            )
        )
    )
  ) {
    throw Error("Invalid work assistant evidence")
  }
  return value
}
