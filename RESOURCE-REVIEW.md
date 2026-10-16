# Hackathon resource review

Reviewed October 16, 2026. Resource index: https://www.wemakedevs.org/hackathons/falkordb/resources

## Implement now

- Persistent Docker Compose storage and health checks. The graph database remains private to the container network. The portal binds to loopback for local use. Public hosting needs an HTTPS reverse proxy or managed ingress.
- Query plan evidence using GRAPH.EXPLAIN. The execution view now exposes the actual assignment lookup plan. Do not claim index use without inspecting the plan.
- Keep source-backed graph paths, fixed parameterized tools, and isolated visitor graphs. These already support the organizer's agent guide.

## Optional after the hosted workflow works

- MCP exposure for the existing read tools. This adds interoperability, but does not improve onboarding correctness by itself. Do not add a second execution path before testing the first.
- Full-text document lookup. Useful when the sample corpus grows. It must complement the supersession graph, not replace explicit authority checks.
- GraphRAG-SDK ingestion of uploaded documents. Valuable for a larger product. Automatic extraction needs review of entity identity, approval, and supersession before it can control a learning plan.

## Do not add for feature count

PageRank, community detection, MaxFlow, multiple agents, and additional memory frameworks do not currently improve the central task. The shortest path and bounded traversals already have specific purposes.

## Development tools

FalkorDB Browser can inspect the graph during development and supply screenshots for the blog. Do not publish an unrestricted database browser for judges. Keep the product's scoped evidence interface.

## Sources

- Docker and persistence: https://docs.falkordb.com/operations/docker
- Query plans: https://docs.falkordb.com/commands/graph.explain
- Browser: https://docs.falkordb.com/browser/
- GraphRAG SDK: https://github.com/FalkorDB/GraphRAG-SDK
- Integrations: https://docs.falkordb.com/integration/
- Organizer guide: https://www.wemakedevs.org/blogs/how-to-build-an-agent-that-reasons-over-a-graph

The linked video topics are listed in the index. Their full contents have not been reviewed. This review covers the written documentation above.
