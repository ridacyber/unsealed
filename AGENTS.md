<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules (read before editing anything)
- File ownership is in OWNERS.md. Frontend work only touches app/page.tsx, app/layout.tsx, app/globals.css, app/results/, components/, samples/.
- Do not edit lib/schema.ts, anything in lib/pipeline/, app/api/, scripts/, or eval/ without asking the user first.
- Build UI against mockResult in lib/mock.ts. Do not call the Nebius API from the frontend.
- Never read, print, create, or commit .env files or API keys. Never paste secrets into code.
- Do not run git push, git reset --hard, or force-push. Do not delete files outside your owned paths.
- If a task requires changing a file you don't own, stop and tell the user instead.
