<!-- owner: r -->
# Nebius / NVIDIA feedback notes

We used Nebius Token Factory with the model Qwen/Qwen3-30B-A3B-Instruct-2507 behind Unsealed, an app that explains official letters in plain language and checks every answer against the letter's own text. Everything below is something we actually ran into while building it.

## What worked
- The API is OpenAI-compatible. A plain fetch to the chat completions endpoint with a bearer key worked with no SDK.
- Every response included prompt and completion token counts, so we could compute the cost of each letter exactly.
- JSON mode (response_format json_object) was accepted by this model.
- GET /v1/models returned the model IDs our key could use, which made picking a model quick.
- The console catalog shows price per 1M input/output tokens and tokens per second for each model, which helped us choose between a 235B and a 30B model.
- Cost was a non-issue: a full 15-letter evaluation (about 24k input and 8k output tokens) cost roughly half a cent, so our $50 in credits was far more than we needed.

## Friction we hit
- Console catalog search did not find a model when we typed its full API ID (Qwen/Qwen3-30B-A3B-Instruct-2507). It returned "No models found." Searching the short name worked. Matching on the API ID would help, since that is what developers have in hand.
- We copied prices by hand from the catalog into environment variables to compute cost. We only read the id field from /v1/models, so if the API also returns prices we did not see it.
- Latency varied a lot with identical code and prompts. Average per-letter time in our evaluation ranged from about 5.6s to 12.9s across runs, and one upload through the browser took 18.6s. That makes a live demo hard to plan. Documented expected latency, or a way to see current load, would help.
- Temperature 0 did not give repeatable output. The same prompt and the same letter produced different answers on different runs (one field flipped in 3 of 5 runs). If hosted serving is not deterministic, saying so in the docs would help. We added checks outside the model instead of relying on repeatability.
- The model list gives only IDs, so we inferred instruct versus reasoning models from the names. A type tag in the API response would remove the guessing.

## What we did not try
- NVIDIA Nemotron models (they appear in the model list), vision models (we limited uploads to PDF), fine-tuning, dedicated endpoints, and batch.

## Rida to add (in your own words)
- Sign-up and getting credits:
- Docs and quickstart:
- Anything else you would tell the Nebius or NVIDIA team:
