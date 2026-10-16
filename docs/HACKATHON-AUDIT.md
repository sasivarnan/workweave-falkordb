# FirstTask: Company Brain entry audit

Reviewed 17 October 2026. Target: Company Brain / M6 Mac Mini.

This is an evidence audit, not a prediction of winning. No numerical judging weights were found in the public event pages. Do not invent a rubric or treat registration count as submission count.

## Source precedence and open conflicts

- [Rules](https://www.wemakedevs.org/hackathons/falkordb/rules), [overview and FAQ](https://www.wemakedevs.org/hackathons/falkordb), [schedule](https://www.wemakedevs.org/hackathons/falkordb/schedule).
- [October 13 announcement](https://x.com/WeMakeDevs/status/2109956066121257042): checked in browser; asks for a live link. The rules allow complete local setup instead. Meet the stricter live-link requirement.
- [October 14 announcement](https://x.com/WeMakeDevs/status/2110303349841277151): checked in browser; emphasizes connected investigation and an explanation path.
- [Organizer article](https://www.wemakedevs.org/blogs/how-to-build-an-agent-that-reasons-over-a-graph): says one track, unlike the rules. Enter Company Brain only; this avoids the conflict and matches the desired prize.
- Deadline: 18 October 2026, 11:59 PM IST. Do not assume an extension.

## All 18 numbered rules

| Rule | Audit result |
|---|---|
| 1 Team | Solo; registration and sole-team membership need participant confirmation. |
| 2 Primary database | FalkorDB stores operational context and progress. |
| 3 Central graph work | Guidance and action gates require graph queries. |
| 4 Runtime | Docker selected; permitted. |
| 5 Track | Name Company Brain in submission. |
| 6 Data rights | Synthetic company dataset. |
| 7 Deadline | Submit before the stated cutoff. |
| 8 Event work | First commit: October 16; participant must confirm actual start. |
| 9 Reuse | shadcn and dependencies attributed; original implementation in Git. |
| 10 Deliverables | README, model and queries ready; public repository, video and hosting need verification. |
| 11 AI disclosure | Explicit in README and blog. |
| 12 Understanding | Participant review guide prepared; human verification pending. |
| 13 Contribution | User chose scope and design; technical understanding must be demonstrated. |
| 14 Prizes | Target Company Brain, without a prize guarantee. |
| 15 Ownership | Solo ownership; third-party licences retained. |
| 16 Respect | No unsolicited judge/community messages. |
| 17 Integrity | No copied entry, fake evaluation, or judging manipulation. |
| 18 Conduct | [Code of Conduct](https://www.wemakedevs.org/coc) reviewed. |

## Complete resource-index inventory

Every top-level resource was opened or attempted. This is not a claim that every page of the sponsor documentation or every playlist video was watched.

| Resource | Review / decision |
|---|---|
| [Getting started](https://docs.falkordb.com/getting-started/) | Docker, official client, typed relationships verified. |
| [Documentation](https://docs.falkordb.com/) | Index, Cypher, algorithms and operational pages inspected. |
| [FalkorDB repository](https://github.com/FalkorDB/FalkorDB) | Core database; keep sponsor role central. |
| [GraphRAG SDK](https://github.com/FalkorDB/GraphRAG-SDK) | Ingestion/retrieval APIs reviewed; no unvalidated approval extraction. |
| [Docker / Compose](https://docs.falkordb.com/operations/docker) | Named storage, AOF, private network, health checks. |
| [Cloud](https://app.falkordb.cloud/) | Login-gated; no quota, credits, or persistence assumed. |
| [Browser](https://docs.falkordb.com/browser/) | Development inspection; do not expose unrestricted graph editing. |
| [Cypher](https://docs.falkordb.com/cypher/) | Parameterized paths, optional matches, merges and indexes used. |
| [Clients](https://docs.falkordb.com/getting-started/clients) | Official Python client used. |
| [Algorithms](https://docs.falkordb.com/algorithms/) | SPpaths verified; BFS and other categories assessed. |
| [Integrations](https://docs.falkordb.com/integration/) | Reviewed; direct client fits the current product. |
| [Community projects](https://www.falkordb.com/community-projects/) | Examples reviewed; vendor performance claims not adopted. |
| [Organizer agent guide](https://www.wemakedevs.org/blogs/how-to-build-an-agent-that-reasons-over-a-graph) | Fixed tools and explicit unknown states applied. |
| [Cypher video](https://www.youtube.com/watch?v=emUQmEitSGY) | Page inspected; transcript unavailable; not fully reviewed. |
| [Algorithms video](https://www.youtube.com/watch?v=aFkgUT0ubYY) | Transcript unavailable; written algorithm references reviewed. |
| [Graph and RAG playlist](https://www.youtube.com/playlist?list=PL_SzmSBoVe82kQKf5l_hDxu2yj7FEJDHB) | Opened; usable contents unavailable; not fully reviewed. |
| [Cloud playlist](https://www.youtube.com/playlist?list=PL_SzmSBoVe82pWDPjSDH8QZP6kGxfVjut) | Web fetch failed; not fully reviewed. |

Further technical references: [SPpaths](https://docs.falkordb.com/algorithms/sppath), [BFS](https://docs.falkordb.com/algorithms/bfs), [indexing](https://docs.falkordb.com/cypher/indexing), [full-text index](https://docs.falkordb.com/cypher/indexing/fulltext-index), [GRAPH.EXPLAIN](https://docs.falkordb.com/commands/graph.explain), [documentation index](https://docs.falkordb.com/llms.txt).

## Why this should compete in Company Brain

The entry must prove a complete chain: employee → assignment → service → current decision → original source → required training → recorded reviewer → stored review request. Changing a decision invalidates the accepted plan and requires a new evidence check. The product now does a bounded piece of company work rather than only showing search results.

A judge should see the benefit within 15 seconds: an outdated starter guide and its approved replacement, with the affected task and source links. Within two minutes, show a saved plan invalidated by a decision change and a review request guarded by current company context.

## Technical decisions after research

- Keep authority explicit. Similarity, recency and popularity do not determine approval.
- Use the native shortest-path procedure for employee-to-service explanation; do not use PageRank to imply reviewer permission.
- Preserve source and decision identity in saved plans and requests. Equal titles do not imply equal authority.
- Do not add GraphRAG SDK, MCP, vector search or multiple agents only for feature count. None is stated as mandatory for Company Brain.
- The model currently chooses presentation after one fixed graph tool call. This is a bounded assistant, not an autonomous planner. Present it honestly.
- The eight-case keyword diagnostic is deliberately narrow. It does not prove superiority over vector RAG or another model.

## Remaining release gates

1. Confirm registration, actual development start and participant understanding.
2. Verify public GitHub repository and licence.
3. Select hosting, deploy with HTTPS, verify live agent and isolated workspaces.
4. Record the final working demo and put its public URL in the submission.
5. Review and publish the blog if entering the side prize.
6. Submit Company Brain before the deadline; retain receipt.

No gate is complete merely because a draft, deployment file or screenshot exists.
