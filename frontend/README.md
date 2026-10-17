# Workweave frontend

React, TypeScript, Vite, Tailwind and shadcn. XState Store holds application state.

From the repository root:

```sh
npm ci --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
```

The Python server serves `frontend/dist`. See the [root README](../README.md) for setup and architecture.

- `src/App.tsx`: workspace, onboarding tour and technical proof views.
- `src/lib/workspace.ts`: response types and A2UI subset validation.
- `src/lib/app-store.ts`: local application state.
- `src/lib/tour.ts`: application tour instructions.
- `src/components/ui`: shadcn controls.
- `src/index.css`: framework imports, fonts and theme tokens. Layout uses Tailwind classes.

Company records come from the server. Provider keys must stay on the server.
