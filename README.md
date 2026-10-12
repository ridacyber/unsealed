# Unsealed

Unsealed takes a PDF of an official letter and returns four answers: **how much** is owed, **when** it is due, **what to do** next, and **what happens if you ignore it**.

<!-- TODO: add the live demo URL here once deployed -->

To combat LLM hallucinations, Unsealed uses a **"Model Proposes, Application Verifies"** design pattern. The backend checks that every quote the model cites really appears in the text extracted from the PDF (ignoring whitespace, letter case, and quote style), and labels each answer **Verified**, **Unsure**, or **Not Found**. Verified means the cited words are in the letter and the model raised no conflict or doubt about them. It does not independently check the plain-language wording of the answer, so the app always shows the letter's own words next to it.

A second model reads the same letter and looks for **passages that cannot both be followed or both be true** (for example, "pay through the new portal" and "keep paying the old way until you are notified"). When it finds one, the app shows a warning with both passages and downgrades only the affected answer from Verified to Unsure.

Privacy and terms: see the in-app pages at `/privacy` and `/terms`.

---

## 🛠️ Tech Stack & Infrastructure

*   **Frontend:** Next.js / React (Zod schema shared with the backend)
*   **Backend:** Next.js route handler in TypeScript; plain `fetch` to an OpenAI-compatible endpoint (no SDK)
*   **AI Infrastructure:** Nebius Token Factory (Serverless Inference)
*   **Extraction model:** `Qwen/Qwen3-30B-A3B-Instruct-2507`
*   **Contradiction-check model:** NVIDIA Nemotron Ultra (`nvidia/Nemotron-3-Ultra-550b-a55b`), served by Nebius
*   **PDF Extraction:** `unpdf`

### Why Qwen-30B for extraction?
During development, we evaluated both the **30B model** and the **235B model** on Nebius's infrastructure. We chose the 30B variant:
*   **Performance:** ~70 tokens/sec (30B) vs. ~27 tokens/sec (235B), per the Nebius console
*   **Cost Efficiency:** \$0.10/\$0.30 per million tokens. Our 15-letter evaluation suite costs about half a cent for extraction (\$0.0048 on a recent run).
*   **Logic Parity:** In our testing, the 235B model tripped over the same complex edge cases as the 30B model, which made the faster, cheaper 30B the clear choice.

### Why NVIDIA Nemotron Ultra for the contradiction check?
We tested four Nemotron models on Nebius, both as the extraction model and as the contradiction checker, on our 15-letter development set (4 of the letters contain a real contradiction). All numbers below are from single or few runs on a set we tuned against, and hosted inference is not fully repeatable even at `temperature: 0`, so treat them as rough.

**Contradiction check** (thinking turned off, 6000 max tokens):

| Model | Conflict letters caught (out of 4) | False alarms on clean letters |
|---|---|---|
| Nemotron Ultra | 4/4 in all 14 dev runs we recorded, including L15 | 1 letter (L13) in 3 of the first 8 runs; 0 in 8 of 8 runs after one prompt line was added (that line was tuned on L13) |
| Nemotron Nano | 3, 3, 4, 2 across four identical runs | 0 |
| Nemotron Super | 1 | 0 |
| Nemotron 3.5 Lightning | 0 | 0 |
| Qwen 30B | 3 (misses L15) | 0 |

**As the extraction model** (15 letters, 60 fields; "dangerous" means an invented value or a vague statement shown as Verified):

| Model | Correct fields | Dangerous | Average time per letter |
|---|---|---|---|
| Qwen 30B | 55-56 of 60 | 0 in each of its last three runs | 10-20 s |
| Nemotron Super | 55-56 of 60 (six runs) | 1 every run, always the same vague "may" wording on L14 | about 3 s |
| Nemotron Ultra | 54 of 60 | 1 (an invented value) | about 12 s |
| Nemotron Nano, thinking off | 49 of 60 | 8 | about 4 s |
| Nemotron Nano, thinking on | 51 of 60 | 4 | about 21 s |

We kept Qwen for extraction because it had the cleanest record on invented or overstated answers, and use Ultra where it was clearly strongest. Super is a close, much faster alternative that we did not ship because of its repeated overclaim on vague wording.

---

## 🏗️ Architecture & Project Layout

*   `app/api/analyze/route.ts`: Accepts the uploaded PDF and returns the result. Internal errors are logged on the server without the letter's text, and users see only a generic or timeout message.
*   `app/privacy`, `app/terms`: Privacy Policy and Terms of Service pages.
*   `lib/schema.ts`: The shared Zod schema used by both frontend and backend.
*   `lib/extract.ts`: Extracts text from the uploaded PDF using `unpdf`. PDF only.
*   `lib/explain.ts`: Sends the letter text to the extraction model (OpenAI-compatible chat completions, `response_format: json_object`), runs the contradiction check at the same time, and assembles the result. Extraction has a 55 second total budget so a request can never outlast the 60 second route limit.
*   `lib/verify.ts`: Finds each quote the model cites in the letter's text (whitespace-, case-, and quote-style-insensitive) and sets the Verified, Unsure, or Not Found label.
*   `lib/contradictions.ts`: The second-pass check. It reports two passages that cannot both be followed, only when both quotes are found in the letter, and only for conflicts about an amount, a date, or an action. A warning downgrades only the matching field (amount, deadline, or required action), and only if that field was Verified. If the check fails or times out, the analysis still returns, with no warnings, and `metrics.checkStatus` is `failed`.
*   `lib/llmOptions.ts`: Optional per-model settings read from `.env`.
*   `eval/`, `scripts/`: Evaluation sets and runners (see below). `eval/results/` holds saved blind-run outputs.

---

## 📊 Evaluation & Metrics

We built an open-book automated evaluation (`eval/run-eval.ts`) that grades a 15-letter development set, which we tuned against, covering hallucinated deadlines, estimates, and vague terms.

### Dev Set Scores
*   **Qwen extraction + Nemotron Ultra check (two runs):** **55 and 56 / 60** correct fields, 0 invented values, 0 wrong amounts or dates, 0 dangerous overclaims, 3-4 safe underclaims. The extra underclaim in one run was a correct field downgraded to Unsure by a false alarm from the checker.
*   **Earlier, Qwen alone:** 56 / 60, with 1 dangerous overclaim (L15, see below).

### Blind Set H01-H08 (earlier test, before the contradiction check existed)
*   **Strict Scoring Accuracy:** **31 / 32** fields correct (**96.9%**).
*   **Broad Correctness:** **32 / 32** fields correct (**100%**).
*   **Zero Hallucinations:** The framework successfully returned *Not Found* across all four core fields for empty/irrelevant test letters (e.g., **H03**).
*   **Edge Case Nuance (H08):** The single strict variance occurred on a semantic boundary where the letter stated a deadline *"by December 11"* and the model extracted *"before December 11"*.

### Blind Set N01-N06, first run (before the check was connected to the app)
Scored independently by a teammate who wrote the letters and the key. These letters were deliberately harder.
*   **Strict field accuracy:** 17 / 24 (70.8%).
*   **Fields shown Verified despite conflicting evidence:** 5. Two fields were Unsure when they did not need to be.
*   **Contradiction detector, run separately:** flagged 3 of the 4 letters with a real conflict, with no false alarms on the 2 clean letters. It missed N04, where the letter says "two hundred seventy dollars ($290.00)".
*   We did not tune against these results. After this run we connected the check to the app and wrote a new blind set.

### Blind Set B01-B08 (full pipeline: Qwen extraction + Nemotron Ultra check)
*   Eight new letters written by a teammate: two clear successes, two expected failures, two 50/50 cases, and two built to throw the model off. The answer key was kept outside the repository and the author of the pipeline had not seen it.
*   One run per letter, with the rules written down and committed before the run (`eval/results/blind-b-prereg.md`). Raw outputs are in `eval/results/blind-b-run1/`.
*   All 8 letters produced output with no errors, and the contradiction check ran on every letter.
*   **RESULTS PENDING: scoring against the private key is still in progress. Replace this line with the per-category and per-field results before submitting.**
*   This run used the `.txt` versions of the letters, so it does not test PDF text extraction.

---

## ⚠️ Known Limitations

*   **The "Letter 15" edge case.** L15 tells the reader to pay through a new portal, then says the portal isn't active yet and to keep paying exactly as before. The answer key marks the required action Unsure because the instructions conflict. Qwen alone reads it as resolved and shows Verified almost every time (14 of 16 runs in one test), even at `temperature: 0`. The 235B model failed it too. With the contradiction check connected, Ultra flagged L15 in every dev run we recorded and the required action is downgraded to Unsure, but L15 is a letter we tuned against.
*   **The check can be wrong in both directions.** Before we added one prompt line, Ultra sometimes reported a conflict on a clean letter (L13), once with an explanation that said there was no contradiction. The line fixed it on our dev runs, but it was tuned on that same letter. The check can also miss a conflict.
*   **Conflicts about consequences are not covered.** The check only looks at amounts, dates, and actions, so a conflict about what happens if you do not act is not flagged, and a warning only downgrades the one field it is about. A related field that repeats the conflicting figure can stay Verified.
*   **Words versus numbers.** A letter that writes an amount two ways ("two hundred seventy dollars ($290.00)") was missed in our blind test.
*   **Vague wording.** A statement like "further action may be taken" can be shown as Verified by some models.
*   **Results vary from run to run.** Hosted inference is not fully repeatable at `temperature: 0`, so single-run scores can move by a field or two.
*   **Speed.** An upload takes about 10-20 seconds with the current extraction model.
*   **Failed checks are quiet.** If the contradiction check fails, the app returns the normal answers with no warning. `metrics.checkStatus` reports `failed`, which a front end can use to tell the user the check was unavailable.
*   **Input limits.** PDF only, with readable text (no scans), and up to 20,000 characters.
*   The site's honesty section tells users that Unsealed can miss letters that say different things in different places.

---

## 🚀 Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your API key:
```bash
cp .env.example .env
```
The app reads `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_INPUT_USD_PER_M` and `LLM_OUTPUT_USD_PER_M` (any OpenAI-compatible endpoint; we use Nebius Token Factory). The two price variables are only used to report cost.

The contradiction check uses its own optional settings and falls back to the `LLM_*` values for any it does not find:

CHECK_MODEL=nvidia/Nemotron-3-Ultra-550b-a55b
CHECK_MAX_TOKENS=6000
CHECK_EXTRA_BODY={“chat_template_kwargs”:{“enable_thinking”:false}}
CHECK_INPUT_USD_PER_M=...
CHECK_OUTPUT_USD_PER_M=...

`LLM_MAX_TOKENS` and `LLM_EXTRA_BODY` work the same way for the extraction model. If `CHECK_MODEL` is not set, the check runs on the extraction model.

### 2. Install & Run Development
```bash
npm install
npm run dev
```

### 3. Run the Test Suites
To run the 15-letter automated evaluation:
```bash
npx tsx eval/run-eval.ts
```
To run the contradiction check on its own against the dev letters:
```bash
npx tsx scripts/check-contradictions.ts
```
To check that every citation and warning points at the right text in the returned letter:
```bash
npx tsx scripts/check-offsets.ts eval/letters
```
To run a blind set (folder, filename prefix, file type):
```bash
npx tsx scripts/run-holdout.ts eval/letters B txt
```

---

## 📄 License
Distributed under the MIT License. See [LICENSE](LICENSE) for details.
