# Who owned what

The final record at submission (October 2026). Do not read authorship off the commit author field: some frontend commits were re-committed under Rida's account so Vercel's free Hobby plan would build them (see the Team section of the README). This file is the record.

## Muhammad Bin Zeeshan (@muhamzes): frontend, design, test letters, scoring

| Path | What it is |
|---|---|
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Pages, layout and global styles |
| `app/results/` | Results route |
| `components/` | Landing, upload, results and evidence workspace, waiting/failure/recovery screens, contradiction banner, samples, hooks, citation logic (`components/lib/citation.ts`), unit tests |
| `samples/`, `public/samples/` | Prepared sample results and the downloadable fictional sample PDF |
| `eval/letters/` | Every test letter: development, holdout and blind sets, including the set C preregistration files and SHA-256 list |
| `eval/answer-key.csv` | Development answer key |

Also his: scoring every blind set by hand against the private key, auditing the frozen runs, the demo letters and video script, hand-testing the deployed app, and the review findings listed in the README.

## Rida Rahim (@ridacyber): backend, platform, evaluation harness, deployment

| Path | What it is |
|---|---|
| `app/api/` | The analyze endpoint |
| `lib/` (except `schema.ts`) | `explain.ts`, `verify.ts`, `contradictions.ts`, `extract.ts`, `llmOptions.ts` |
| `scripts/` | Evaluation runners and regression checks |
| `eval/run-eval.ts`, `eval/results/` | Development eval harness and saved run outputs |
| `FEEDBACK.md` | Platform feedback for Nebius and NVIDIA |
| `.env*`, the Vercel project | Keys, environment variables, deployment |

Also hers: model selection and prompts, running every blind set once per code version, and the freeze record for set C.

## Shared (talk first)

| Piece | How it was split |
|---|---|
| `lib/schema.ts` | Changed only by agreement. The optional `warnings` field was agreed by both, added by Rida and built into the banner by Muhammad. |
| `README.md`, `OWNERS.md` | Both contribute; each describes their own lane. |
| `app/privacy/`, `app/terms/` | Text by Rida (it must match what the backend does), styling by Muhammad. |
| Config files | Changed by whoever needs it, after a message to the other. |
| `eval/letters/blind-c/PREREGISTRATION.md` | Rules by Muhammad, frozen commit and model settings by Rida. |
| Product decisions | The project and its name, PDF-only uploads, the contradiction warning, wiring the checker into the pipeline. |

## Where one lane touched the other

- Rida in the frontend lane: the initial Next.js scaffold, switching on the live API (`USE_LIVE_API` in `components/hooks/useAnalysis.ts`, with Muhammad's OK), the Privacy and Terms text, and re-committing three of Muhammad's frontend commits (`ff1cbdc`, `ae2f6fa`, `976a59f`) under her account so they would deploy.
- Muhammad in the backend lane: none. `git log --author=Muhammad -- app/api lib scripts` prints nothing.
- Dependencies across the line: `components/lib/citation.ts` imports `indexDocument` from `lib/verify.ts`, and the interface reads the optional `warnings` field from `lib/schema.ts`.

## How we worked

- Both committed straight to `main`, in small commits. No branches or pull requests.
- Sync before working, and work in your own files.
- Before every commit, check the changed-files list. If `.env`, `node_modules` or `.next` appear, stop and message the other person. If a file outside your lane changed, undo it or ask first. AI coding tools edit files you did not ask about.
- A merge conflict was never resolved with "Accept All". The other person was messaged and the conflict fixed together.
- Changing `lib/schema.ts` meant talking first, because the interface and the backend both depend on it.
- Only fabricated or public sample letters were used. No real person's document was committed.
- Before going public: `git log --stat` was checked for secrets and real documents, and README, LICENSE (MIT) and FEEDBACK.md were in place.
