# Workweave web app

React, TypeScript, Vite, Tailwind CSS, and official shadcn base-rhea components.

From the repository root:

```sh
npm ci --prefix frontend
npm run build --prefix frontend
```

The Python server serves `frontend/dist` at http://localhost:8080. See the root README for database and server setup.

## Structure

- `src/App.tsx`: employee workspace, meeting details, task actions, and judge view.
- `src/lib/workspace.ts`: response types and allowlisted A2UI validation.
- `src/components/ui`: official shadcn components.
- `src/index.css`: framework imports and theme tokens only. Layout uses Tailwind classes.

Keep UI components from shadcn. Confirm with the project owner before adding a different UI library. Keep credentials on the server; never place them in Vite environment variables or frontend code.
