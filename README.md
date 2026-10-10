# Unsealed

Unsealed takes a PDF of an official letter and instantly returns four critical answers: **how much** is owed, **when** it is due, **what to do** next, and **what happens if you ignore it**. 

To combat LLM hallucinations, Unsealed uses a **"Model Proposes, Application Verifies"** design pattern. The backend checks every quote proposed by the AI directly against the raw text extraction of the PDF, labeling every single metric as **Verified**, **Unsure**, or **Not Found** with precise string-matching alignment.

---

## 🛠️ Tech Stack & Infrastructure

*   **Frontend:** Next.js / React (Zod schema validation)
*   **Backend:** Pure TypeScript / Node.js (Zero-dependency HTTP footprint)
*   **AI Infrastructure:** Nebius Token Factory (Serverless Inference)
*   **Core Model:** `Qwen/Qwen3-30B-A3B-Instruct-2507`
*   **PDF Extraction:** `unpdf`

### Why Qwen-30B on Nebius?
During development, we evaluated both the **30B model** and the **235B model** on Nebius's infrastructure. We optimized for the 30B variant based on hard empirical data:
*   **Performance:** ~70 tokens/sec (30B) vs. ~27 tokens/sec (235B)
*   **Cost Efficiency:** \$0.10/\$0.30 per million tokens. Running our entire 15-letter evaluation suite costs roughly **half a cent** (\$0.005).
*   **Logic Parity:** Testing revealed that the 235B model tripped over the same complex edge cases as the 30B model, making the faster, cheaper 30B variant the clear engineering choice.

---

## 🏗️ Architecture & Project Layout

The backend relies on a flattened, modular structure inside the `lib/` directory:

*   `lib/schema.ts`: The shared source-of-truth Zod validation schema used by both frontend and backend.
*   `lib/extract.ts`: Extracts raw text streams from incoming PDF buffers using `unpdf`.
*   `lib/explain.ts`: Manages the direct HTTP `fetch` pipeline to the OpenAI-compatible Nebius chat completions API (using `response_format: json_object`).
*   `lib/verify.ts`: Implements `indexDocument`. It acts as the ultimate truth engine, running strict whitespace-insensitive string matching to ensure the model's quotes exist word-for-word in the original text.
*   `lib/contradictions.ts`: An isolated, highly efficient parallel engine that double-checks if the letter contains internal conflicting information (costs ~\$0.0001 per run).

---

## 📊 Evaluation & Metrics

We built an open-book automated evaluation framework (`eval/run-eval.ts`) to grade system accuracy across a 15-letter complex development set, optimizing against hallucinated deadlines, estimates, and vague terms.

### Final Dev Set Scores
*   **Accuracy:** **56 / 60** correct fields.
*   **Invented Values:** 0
*   **Wrong Amounts/Dates:** 0
*   **Safe Underclaims:** 2
*   **Dangerous Overclaims:** 1 (See Known Limitations below)

---

## ⚠️ Known Limitations: The "Letter 15" Edge Case

During deep evaluation iterations, we discovered a consistent failure mode in **L15**. When a document contains highly manipulative or deeply circular legalese, the model consistently triggers an overclaim (14 out of 16 test runs), even at `temperature: 0`. Upgrading to the massive 235B model did not fix this behavior. 

**Our Solution:** Instead of trying to force a non-deterministic model to be perfect, we engineered a dedicated **Contradiction Engine** (`lib/contradictions.ts`). This module runs a secondary, narrow check to locate text passages that explicitly disagree with each other. If a contradiction is flag-verified, the application drops the UI element status down to **Unsure**, warning the user that the letter itself is unreliable.

---

## 🚀 Getting Started

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
NEBIUS_API_KEY=your_nebius_api_key_here
USE_LIVE_API=true
```

### 2. Install & Run Development
```bash
npm install
npm run dev
```

### 3. Run the Test Suites
To run the 15-letter automated evaluation pipeline:
```bash
npx ts-node eval/run-eval.ts
```
To run the blind holdout suite:
```bash
npx ts-node scripts/run-holdout.ts
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.

