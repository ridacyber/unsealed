<!-- owner: Rida Rahim -->
# Nebius x NVIDIA Global AI Hackathon: Infrastructure & Model Feedback

We built **Unsealed**, a web application that ingests official PDF letters and extracts four critical pillars: *how much, when, what to do,* and *what happens if you ignore it*. The application relies on a "model proposes, application verifies" architecture, matching LLM outputs against raw text extractions via custom schema validation. A second model, **NVIDIA Nemotron Ultra**, reads the same letter and flags passages that contradict each other.

**Our Stack:**
*   **Infrastructure:** Nebius Token Factory (Serverless Inference)
*   **Extraction model:** `Qwen/Qwen3-30B-A3B-Instruct-2507`
*   **Contradiction-check model:** `nvidia/Nemotron-3-Ultra-550b-a55b`
*   **Also tested:** `NVIDIA-Nemotron-3-Nano-30B-A3B`, `nemotron-3-super-120b-a12b`, `Nemotron-3_5-Lightning`, and Qwen 235B

A note on our numbers: the model comparisons come from a 15-letter development set we tuned against, with one to a few runs per setting, so treat them as rough. Results for the shipped pipeline on blind sets are in the README.

---

## What Worked & Developer Onboarding

*   **Seamless Integration:** The OpenAI-compatible API allowed us to use direct HTTP `fetch` calls to the chat completions endpoint without needing to install heavy external SDKs.
*   **Discovery APIs:** The `GET /v1/models` endpoint worked flawlessly, letting us quickly inspect the model IDs authorized for our API key, including the Nemotron models.
*   **Cost Efficiency & Analytics:** Every API response provided transparent prompt and completion token counts. At **\$0.10 / \$0.30 per million tokens** for the 30B model, a comprehensive 15-letter evaluation suite (approx. 24k input and 8k output tokens) cost **roughly half a cent**. The \$50 hackathon credit allowed us to run deep, iterative evals without hitting financial constraints.
*   **Catalog UI Transparency:** The console catalog cleanly displays pricing per 1M input/output tokens and expected tokens per second (e.g., 70 tok/s for the 30B vs. 27 tok/s for the 235B), which immediately guided our architectural choice.
*   **Structured Output:** The 30B model handled JSON mode (`response_format: { type: "json_object" }`) reliably, enforcing the strict formatting required by our frontend validation schema.
*   **Nemotron through the same API:** All four Nemotron models worked through the same chat completions endpoint and JSON mode, and a model-specific option (`chat_template_kwargs`) passed through in the request body without any special setup.
*   **Nemotron Ultra as a contradiction checker:** It caught all four contradicting letters in our dev set, including one that Qwen missed, at about one second per letter.
*   **Nemotron Super:** Very fast (about 3 seconds per letter on average for extraction) and close to Qwen in accuracy on our set.

---

## 🔍 Nemotron Findings

### 1. Nano's thinking mode used up a small token limit
*   **What happened:** With our app's 1,200-token limit, Nemotron Nano returned an empty `content` field on all 15 letters. Its reasoning consumed the whole token budget.
*   **What fixed it:** Raising the limit to 6,000 tokens worked (about 7 seconds on a test letter). Sending `chat_template_kwargs: {"enable_thinking": false}` also worked (about 1.8 seconds), and Nebius honored that switch. We confirmed the switch's effect on Nano only. We sent it to the other Nemotron models too but did not check it separately.
*   **Recommendation:** Document per model whether it reasons by default and which request option turns it off, and consider returning reasoning text separately from `content` so a small token limit does not produce an empty answer without explanation.

### 2. Results at temperature 0 varied for Nemotron too
*   Across four identical runs, Nano caught 3, 3, 4, and 2 of the 4 contradicting letters. Ultra caught all four in each of four repeat runs, but reported a conflict on the same clean letter (L13) in two of them.
*   **Recommendation:** If speculative decoding or batching causes this, say so in the docs so developers plan for it.

### 3. Ultra sometimes reported a conflict and then argued against it
*   In some runs Ultra returned an item whose own explanation said the amounts were consistent and "there is no contradiction." One extra sentence in the prompt (leave out items you judge consistent) removed this in 8 of 8 follow-up runs. That sentence was tuned on the same letter, so it needs fresh letters to confirm.

### 4. Extraction comparison (15 letters, 60 fields)
*   Qwen 30B: 55-56 correct, 0 dangerous. Super: 55-56 correct, 1 dangerous every run (the same vague "may" wording shown as Verified). Ultra: 54 correct, 1 invented value. Nano: 49 correct with 8 dangerous (thinking off) and 51 with 4 dangerous (thinking on).
*   We kept Qwen for extraction because it had the cleanest record on invented or overstated answers.

### 5. A model with no description
*   `nvidia/Nemotron-3_5-Lightning` appears in `/v1/models` with no description. We tried it as a contradiction checker with thinking off and it caught 0 of 4, but we do not know whether that reflects the model or our settings.
*   **Recommendation:** Add a short description and capabilities field to each model entry (see below).

### 6. Ultra as the checker on blind letters
*   With the prompt sentence from finding 3 in place, Ultra ran as the checker (thinking off, 6,000 max tokens) on two blind sets of eight letters each. Set B: one real contradiction caught, one missed, three false warnings. Set C: both expected contradictions caught, no false warnings. Eight letters per set is too few for a rate, so treat these as observations. The full evaluation record is in the README.

---

## 🔍 Friction, Bottlenecks, & Technical Discoveries

### 1. Console Search Behavior
*   **The Issue:** Searching the console catalog using the exact full API ID (`Qwen/Qwen3-30B-A3B-Instruct-2507`) returned *"No models found"*. We had to guess and search by the short name to find it.
*   **Recommendation:** Update the console catalog UI search index to match on exact API string identifiers, as this is the exact string developers paste into their codebases.

### 2. Pricing Metadata in API Response
*   **The Issue:** We had to hardcode token costs into our environment variables by manually copying them from the web console. The `GET /v1/models` response has only the model ID, a creation time, and an owner, with no price.
*   **Recommendation:** Exclude the friction of manual UI parsing by appending pricing metadata or a billing object directly to the `GET /v1/models` API payload.

### 3. Latency Variance & Demo Planning
*   **The Issue:** We observed severe latency spikes under identical prompts, inputs, and payloads. During automated 15-letter eval runs, average per-letter response times fluctuated between **5.6s and 12.9s** in early runs, and later runs of the same code on the same model averaged **9.6s, 13.3s, 19.1s, and 20.2s**. A single browser upload hit a peak latency of **18.6 seconds**.
*   **What did not add latency:** Running the contradiction check at the same time as extraction added no wait (the check took 0.5-1.4 seconds per letter).
*   **Recommendation:** Provide a system status page, an error/warning header for high-load clusters, or clear documentation detailing baseline queue/cold-start behaviors so developers can build better UI loaders for high-stakes hackathon demos.

### 4. Non-Deterministic Behavior at Temperature 0
*   **The Issue:** Setting `temperature: 0` did not provide deterministic, repeatable outputs. Across identical prompt/document eval iterations, specific verification fields flipped flags in 3 out of 5 runs. This variance occurred on both the 30B model and the 235B model, and on the Nemotron models (see above).
*   **Impact:** We had to engineer systemic application-level guardrails (e.g., automated string post-processing to ignore line breaks like `cupsfilter` whitespace anomalies, and a custom contradiction check) rather than relying on inference determinism.
*   **Recommendation:** Explicitly document if hosted infrastructure runs on speculative decoding or parallel architectures that disrupt strict `temperature: 0` determinism.

### 5. Lack of Model Type Tags
*   **The Issue:** The `/v1/models` response yields raw strings. We had to infer which models were base, instruct, or reasoning variants solely by string-matching common naming conventions.
*   **Recommendation:** Add a `type` tag or `capabilities` field inside the API response object.

---

## Scope Limitations (What We Did Not Try)
*   **Nemotron coverage:** We used Nemotron Ultra in the shipped app and ran it on two blind sets (above). We tested Nano, Super, and Lightning on our dev set only, mostly with thinking turned off, and we did not tune prompts per model.
*   **Advanced Features:** Due to the hackathon's time box and our explicit focus on text-based PDF verification, we did not test vision models, fine-tuning pipelines, dedicated cluster endpoints, or batch inference.

---

## Developer Experience & Feedback

### Sign-up and getting credits
*   The onboarding workflow and coupon code redemption for the hackathon credits were highly intuitive. Provisioning our initial API keys took less than 2 minutes, allowing us to pivot straight to our codebase.

### Docs and quickstart
*   The API reference is clean and easy to navigate for anyone familiar with the OpenAI ecosystem. However, adding explicit deep dives or reference snippets for setting up strict deterministic pipelines in production would save developers massive troubleshooting cycles.

### Final Thoughts for the Nebius & NVIDIA teams
*   Building on your serverless architecture was highly efficient. The cost-to-performance ratio makes this incredibly competitive for production scaling. If you can smooth out the latency variance spikes, document reasoning and non-reasoning behavior per model, and ensure the console UI search handles exact API strings, this becomes a best-in-class developer platform.
