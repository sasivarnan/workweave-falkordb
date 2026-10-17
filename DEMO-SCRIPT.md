# Workweave judge demonstration

Use the hosted URL after it is verified. All company records are synthetic. Do not record keys or invite codes.

1. 0:00–0:15 — “One approved service decision changes. Which teams need to review their work?” Open Cross-team impact and load the synthetic exports. Show the affected tasks across three teams and the missing owner.
2. 0:15–0:40 — Expand Why affected? for Billing and Support. Show the source issue key, exact calendar link, meeting notes, native shortest dependency path, and Support's alternate route. Explain that source identifiers and service relationships came from normalized exports, not title similarity.
3. 0:40–1:10 — Expand Test one dependency link. Remove Billing → Checkout. Billing leaves the affected set. Support stays affected through another route. Show equal source content hashes, then restore the link.
4. 1:10–1:35 — Open Decision review. Show a saved plan tied to the older decision. Approve the sample replacement and add a newer proposal. The old plan stays intact, the replacement remains current, and linked meeting notes need review. Acknowledge the current version; the saved plan still needs an explicit update.
5. 1:35–1:50 — Show the untouched People task outside the dependency scope and the unmatched source note. Missing links and traversal bounds are stated, rather than treated as proof of safety.
6. 1:50–2:00 — Show saved reproducible checks and the actual query trace. Close with limits: small curated fixture, no live OAuth connectors or production access model. SQL could model these relationships too; FalkorDB provides the relationship traversal and native path explanation in this implementation.

Run the flow once before recording. Prepare the saved plan before step 4. The impact workflow and decision walkthrough use real FalkorDB operations with no AI calls. Optional protected AI layout selection is a separate capability; do not present this deterministic analysis as live LLM reasoning.
