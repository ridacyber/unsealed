# Unsealed

Unsealed takes a PDF of an official letter and returns four answers: **how much** is owed, **when** it is due, **what to do** next, and **what happens if you ignore it**.

To combat LLM hallucinations, Unsealed uses a **"Model Proposes, Application Verifies"** design pattern. The backend checks that every quote the model cites really appears in the text extracted from the PDF (ignoring whitespace, letter case, and quote style), and labels each answer **Verified**, **Unsure**, or **Not Found**. Verified means the cited words are in the letter and the model raised no conflict or doubt about them. It does not independently check the plain-language wording of the answer, so the app always shows the letter's own words next to it.

---

## 🛠️ Tech Stack & Infrastructure

*   **Frontend:** Next.js / React (Zod schema shared with the backend)
*   **Backend:** Next.js route handler in TypeScript; plain `fetch` to an OpenAI-compatible endpoint (no SDK)
*   **AI Infrastructure:** Nebius Token Factory (Serverless Inference)
*   **Core Model:** `Qwen/Qwen3-30B-A3B-Instruct-2507`
*   **PDF Extraction:** `unpdf`

### Why Qwen-30B on Nebius?
During development, we evaluated both the **30B model** and the **235B model** on Nebius's infrastructure. We chose the 30B variant:
*   **Performance:** ~70 tokens/sec (30B) vs. ~27 tokens/sec (235B), per the Nebius console
*   **Cost Efficiency:** \$0.10/\$0.30 per million tokens. Our 15-letter evaluation suite costs about half a cent (\$0.0048 on the last run).
*   **Logic Parity:** In our testing, the 235B model tripped over the same complex edge cases as the 30B model, which made the faster, cheaper 30B the clear choice.

---

## 🏗️ Architecture & Project Layout

*   `app/api/analyze/route.ts`: Accepts the uploaded PDF and returns the result. Internal errors are logged on the server, and users see only a generic message.
*   `lib/schema.ts`: The shared Zod schema used by both frontend and backend.
*   `lib/extract.ts`: Extracts text from the uploaded PDF using `unpdf`. PDF only.
*   `lib/explain.ts`: Sends the letter text to the model (OpenAI-compatible chat completions, `response_format: json_object`) and assembles the result.
*   `lib/verify.ts`: Finds each quote the model cites in the letter's text (whitespace-, case-, and quote-style-insensitive) and sets the Verified, Unsure, or Not Found label.
*   `lib/contradictions.ts`: A separate second-pass check that reports two passages of the letter that cannot both be followed, only when both quotes are found in the letter. Built and evaluated on its own; not yet connected to the app.

---

## 📊 Evaluation & Metrics

We built an open-book automated evaluation (`eval/run-eval.ts`) that grades a 15-letter development set, which we tuned against, covering hallucinated deadlines, estimates, and vague terms.

### Final Dev Set Scores
*   **Accuracy:** **56 / 60** correct fields.
*   **Invented Values:** 0
*   **Wrong Amounts/Dates:** 0
*   **Safe Underclaims:** 2
*   **Dangerous Overclaims:** 1 (See Known Limitations below)

### Final Holdout Set Scores (Blind Test)
*   **Strict Scoring Accuracy:** **31 / 32** fields correct (**96.9%**).
*   **Broad Correctness:** **32 / 32** fields correct (**100%**).
*   **Zero Hallucinations:** The framework successfully returned *Not Found* across all four core fields for empty/irrelevant test letters (e.g., **H03**).
*   **Edge Case Nuance (H08):** The single strict variance occurred on a semantic boundary where the letter stated a deadline *"by December 11"* and the model extracted *"before December 11"*.

---

## ⚠️ Known Limitations: The "Letter 15" Edge Case

L15 tells the reader to pay through a new portal, then says the portal isn't active yet and to keep paying exactly as before. The answer key marks the required action Unsure because the instructions conflict. The model reads it as resolved and shows Verified almost every time (14 of 16 runs in one test), even at `temperature: 0`. The 235B model failed it too, and the prompt already contains a rule for this case that the model doesn't follow here.

We built a separate contradiction check (`lib/contradictions.ts`). On our dev set it caught 3 of the 4 self-contradicting letters and had no false alarms on the others, but it missed L15 itself. It is not yet connected to the app, so the app can still show Verified for L15's required action. The site's honesty section tells users that Unsealed can miss letters that say different things in different places.

---

## 🚀 Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your API key:
```bash
cp .env.example .env
```
The app reads `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_INPUT_USD_PER_M` and `LLM_OUTPUT_USD_PER_M` (any OpenAI-compatible endpoint; we use Nebius Token Factory). The two price variables are only used to report cost. Live mode is already on in the code.

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
To run the blind holdout suite (pass a folder to run a different set):
```bash
npx tsx scripts/run-holdout.ts
```

---

## 📄 License
Distributed under the MIT License. See [LICENSE](LICENSE) for details.
