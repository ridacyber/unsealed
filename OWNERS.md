# Who owns what
**Muhammad Bin Zeeshan (frontend):** app/page.tsx, app/layout.tsx, app/globals.css, app/results/, components/, samples/, public/samples/, eval/letters/, eval/answer-key.csv
**Rida Rahim (backend):** app/api/, lib/, scripts/, eval/run-eval.ts, eval/results/, FEEDBACK.md, .env*
**Shared (talk first):** lib/schema.ts, README.md, OWNERS.md, config files, app/privacy/ and app/terms/ (text: Rida, styling: Muhammad)

Files that can't hold a comment (json, csv, txt, svg) follow this list instead of a header.

---

# How we work

## Setup (once)
- The repo is private on GitHub until submission, when we make it public together.
- Clone it, run `npm install`, then `cp .env.example .env`.


## Every work session
1. **Sync first.** VS Code Source Control tab > Sync Changes (pulls the other person's work).
2. Work only in your own files (see the owner list above).
3. When something works: check the changed-files list, type a short message, Commit, then Sync Changes.

## Before every commit, check the file list
- If `.env`, `node_modules`, or `.next` appear, STOP and message the other person.
- If a file outside your folders changed (especially `lib/schema.ts`), undo that change or ask first.
- AI coding tools edit files you didn't ask about. Glance at the list every time.

## Rules
- We both commit straight to `main`. No branches or pull requests.
- Commit small and often (every time something works), not once a day.
- If you see a merge conflict, do NOT click "Accept All." Message the other person and we'll fix it together in Live Share.
- Changing `lib/schema.ts` means talking first. The UI and the backend both depend on it.

- Vercel Hobby only builds commits authored by the project owner, so frontend commits are re-committed under Rida's account before they ship (see the Team section of the README).
- Use only fabricated or public sample letters. Never commit a real person's document.

## Before submission
- Check `git log --stat` for secrets or real documents. Making the repo public publishes the whole history.
- README, LICENSE (MIT), and FEEDBACK.md must be in place.
