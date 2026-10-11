// owner: r
// Optional per-model request settings, read from .env at call time (the eval scripts load .env after imports).
// LLM_MAX_TOKENS: replaces each call's default token limit.
// LLM_EXTRA_BODY: a JSON object merged into every request, e.g. {"chat_template_kwargs":{"enable_thinking":false}}.

export function maxTokens(fallback: number): number {
  const n = Number(process.env.LLM_MAX_TOKENS);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function extraBody(): Record<string, unknown> {
  const raw = process.env.LLM_EXTRA_BODY;
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("LLM_EXTRA_BODY must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}
