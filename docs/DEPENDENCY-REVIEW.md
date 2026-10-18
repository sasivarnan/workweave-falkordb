# Dependency review

Reviewed on 2026-10-18 with `npm audit --json` in `frontend`.

The audit reports seven high-severity package entries. They trace to one advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), a stack-exhaustion issue in `braces` through 3.0.3. The advisory lists no patched version.

The affected path comes through the shadcn CLI and its registry / file-matching dependencies. This project imports `shadcn/tailwind.css` at build time. It does not expose the CLI or a glob-pattern API to employees. The final Docker runtime runs Python and serves compiled frontend assets; it does not run Node.js or ship its `node_modules` directory.

This limits the deployed exposure but does not remove the build-tool finding. Do not run the affected tooling on untrusted patterns or repositories. No forced major downgrade or unverified override was applied. Recheck the advisory and update compatible tooling when a fix is available.

This review is not a complete security audit. Reproduce with `npm audit --prefix frontend`.
