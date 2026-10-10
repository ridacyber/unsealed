<!-- owner: r -->
# Nebius x NVIDIA Global AI Hackathon: Infrastructure & Model Feedback

We built **Unsealed**, a web application that ingests official PDF letters and extracts four critical pillars: *how much, when, what to do,* and *what happens if you ignore it*. The application relies on a "model proposes, application verifies" architecture, matching LLM outputs against raw text extractions via custom schema validation.

**Our Stack:** 
*   **Infrastructure:** Nebius Token Factory (Serverless Inference)
*   **Model:** `Qwen/Qwen3-30B-A3B-Instruct-2507`

---

## What Worked & Developer Onboarding

*   **Seamless Integration:** The OpenAI-compatible API allowed us to use direct HTTP `fetch` calls to the chat completions endpoint without needing to install heavy external SDKs. 
*   **Discovery APIs:** The `GET /v1/models` endpoint worked flawlessly, letting us quickly inspect the model IDs authorized for our API key.
*   **Cost Efficiency & Analytics:** Every API response provided transparent prompt and completion token counts. At **\$0.10 / \$0.30 per million tokens** for the 30B model, a comprehensive 15-letter evaluation suite (approx. 24k input and 8k output tokens) cost **roughly half a cent**. The \$50 hackathon credit allowed us to run deep, iterative evals without hitting financial constraints.
*   **Catalog UI Transparency:** The console catalog cleanly displays pricing per 1M input/output tokens and expected tokens per second (e.g., 70 tok/s for the 30B vs. 27 tok/s for the 235B), which immediately guided our architectural choice.
*   **Structured Output:** The 30B model handled JSON mode (`response_format: { type: "json_object" }`) reliably, enforcing the strict formatting required by our frontend validation schema.

---

## 🔍 Friction, Bottlenecks, & Technical Discoveries

### 1. Console Search Behavior
*   **The Issue:** Searching the console catalog using the exact full API ID (`Qwen/Qwen3-30B-A3B-Instruct-2507`) returned *"No models found"*. We had to guess and search by the short name to find it.
*   **Recommendation:** Update the console catalog UI search index to match on exact API string identifiers, as this is the exact string developers paste into their codebases.

### 2. Pricing Metadata in API Response
*   **The Issue:** We had to hardcode token costs into our environment variables by manually copying them from the web console.
*   **Recommendation:** Exclude the friction of manual UI parsing by appending pricing metadata or a billing object directly to the `GET /v1/models` API payload.

### 3. Latency Variance & Demo Planning
*   **The Issue:** We observed severe latency spikes under identical prompts, inputs, and payloads. During automated 15-letter eval runs, average per-letter response times fluctuated wildly between **5.6s and 12.9s**. A single browser upload hit a peak latency of **18.6 seconds**. 
*   **Recommendation:** Provide a system status page, an error/warning header for high-load clusters, or clear documentation detailing baseline queue/cold-start behaviors so developers can build better UI loaders for high-stakes hackathon demos.

### 4. Non-Deterministic Behavior at Temperature 0
*   **The Issue:** Setting `temperature: 0` did not provide deterministic, repeatable outputs. Across identical prompt/document eval iterations, specific verification fields flipped flags in 3 out of 5 runs. This variance occurred on both the 30B model and the 235B model. 
*   **Impact:** We had to engineer systemic application-level guardrails (e.g., automated string post-processing to ignore line breaks like `cupsfilter` whitespace anomalies, and a custom contradiction check script) rather than relying on inference determinism.
*   **Recommendation:** Explicitly document if hosted infrastructure runs on speculative decoding or parallel architectures that disrupt strict `temperature: 0` determinism.

### 5. Lack of Model Type Tags
*   **The Issue:** The `/v1/models` response yields raw strings. We had to infer which models were base, instruct, or reasoning variants solely by string-matching common naming conventions.
*   **Recommendation:** Add a `type` tag or `capabilities` field inside the API response object.

---

## Scope Limitations (What We Did Not Try)
*   **NVIDIA Models:** While NVIDIA Nemotron models were visible in our `/v1/models` array, we focused strictly on the Qwen family.
*   **Advanced Features:** Due to the hackathon's time box and our explicit focus on text-based PDF verification, we did not test vision models, fine-tuning pipelines, dedicated cluster endpoints, or batch inference.

---

## Developer Experience & Feedback

### Sign-up and getting credits
*   The onboarding workflow and coupon code redemption for the hackathon credits were highly intuitive. Provisioning our initial API keys took less than 2 minutes, allowing us to pivot straight to our codebase.

### Docs and quickstart
*   The API reference is clean and easy to navigate for anyone familiar with the OpenAI ecosystem. However, adding explicit deep dives or reference snippets for setting up strict deterministic pipelines in production would save developers massive troubleshooting cycles.

### Final Thoughts for the Nebius & NVIDIA teams
*   Building on your serverless architecture was highly efficient. The cost-to-performance ratio makes this incredibly competitive for production scaling. If you can smooth out the latency variance spikes and ensure the console UI search handles exact API strings, this becomes a best-in-class developer platform.

