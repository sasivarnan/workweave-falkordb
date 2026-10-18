# Workweave frontend

React, TypeScript, Vite, Tailwind and shadcn. XState Store holds application state.

From the repository root:

```sh
npm ci --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
```

For development, run `npm run dev --prefix frontend` and open http://localhost:5173. Vite proxies `/api` to the separate backend on port 8081; see the root README for its watch command.

For a built application, the Python server serves `frontend/dist`. See the [root README](../README.md) for setup and architecture.

- `src/App.tsx`: workspace, onboarding tour and technical proof views.
- `src/lib/workspace.ts`: response types and A2UI subset validation.
- `src/lib/app-store.ts`: local application state.
- `src/lib/tour.ts`: Home and navigation tour instructions.
- `src/hooks/use-onboarding-tour.ts`: Driver.js lifecycle, theme, cleanup and XState integration.
- `src/components/ui`: shadcn controls.
- `src/index.css`: framework imports, fonts and theme tokens. Layout uses Tailwind classes.

Company records come from the server. Provider keys must stay on the server.

[Driver.js](https://driverjs.com/docs/configuration) is the approved exception to shadcn-only controls for onboarding. Its library stylesheet supplies overlay positioning; Tailwind classes apply the application theme. React effect cleanup removes the tour, and XState retains application progress and sidebar state.

Search stores the submitted query in `?q=...`. Shared links, refresh, and browser Back and Forward restore the query. Clear removes it from the URL.

The assistant uses a docked chat layout with a fixed composer. Enter sends; Shift+Enter adds a line. XState keeps the last six replies in memory. Record changes mark earlier replies as previous checks. **Why this answer?** shows the checked graph evidence through the custom A2UI subset.
