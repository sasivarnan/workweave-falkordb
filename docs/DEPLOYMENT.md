# Deploy with Render and FalkorDB Cloud


[render.yaml](../render.yaml) builds the existing Dockerfile as one web service: Python serves the UI and APIs. FalkorDB runs separately in FalkorDB Cloud. Docker Compose is for local use only.

1. Create a FalkorDB Cloud instance with **TLS enabled** and a public endpoint reachable from Render. Copy its host, port, username and password from the connection panel. Use the supplied database port, not a browser-console URL.
2. Push the tested source to GitHub. In Render, select **New → Blueprint** and connect this repository. Review the configuration before creating resources: it selects a **paid service**. The default region is Singapore; change it before creation if another region is closer to your database.
3. Enter `FALKORDB_HOST`, `FALKORDB_PORT`, `FALKORDB_USERNAME` and `FALKORDB_PASSWORD` when prompted. The Blueprint sets `FALKORDB_SSL=true`, `COOKIE_SECURE=true` and `WORKWEAVE_HOST=0.0.0.0`. Render supplies `PORT`; the server reads it automatically.
4. Deploy, then open the assigned `https://<service>.onrender.com` URL. Demo controls are at `/demo-controls`; the health check is `/api/health`. Automatic deployments are off; deploy later source updates manually after checks pass.
5. Verify Home, search, the tour and the remove/restore dependency proof in a fresh browser. If the cloud instance restricts incoming connections, allow the service's Render outbound IP ranges. Never put database credentials in frontend variables or source files.

**Optional AI:** graph workflows work without a provider key. To enable OpenAI, set `AI_PROVIDER=openai`, `OPENAI_API_KEY` and `OPENAI_MODEL` in Render's environment settings. Set `AI_ENABLED=false` to disable AI. Employees enter no key or invite. Keep keys on the server; never use a `VITE_` variable for secrets. Request limits, two concurrent agent slots and bounded model calls remain active. There is no persistent usage counter or application spending cap. Set provider spending controls and check your remaining credit.

**Free Render alternative:** create a free Docker web service with the same database and secure-cookie settings. AI can use the server's provider key. No persistent app disk is required; company data remains in FalkorDB Cloud. Free services sleep after inactivity, so the first visit can be slow.

The Blueprint contains no credentials and does not create the cloud database. Creating it in Render starts a public deployment. See [Render Blueprints](https://render.com/docs/blueprint-spec), [free-service limits](https://render.com/docs/free) and [outbound IP ranges](https://render.com/docs/outbound-ip-addresses).


Deployment is manual. Check the selected source version before recording a demo.
