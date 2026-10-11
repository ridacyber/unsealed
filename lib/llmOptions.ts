// owner: r
// Optional per-model request settings, read from .env at call time (the eval scripts load .env after imports).
// <PREFIX>_MAX_TOKENS: replaces each call's default token limit.
// <PREFIX>_EXTRA_BODY: a JSON object merged into every request, e.g. {"chat_template_kwargs":{"enable_thinking":false}}.
// The default prefix is LLM. A second caller can pass its own prefix (e.g. CHECK); unset values fall back to LLM_*.

function env(name: string, prefix: string): string | undefined {
  return process.env[`${prefix}_${name}`] ?? process.env[`LLM_${name}`];
}

export function maxTokens(fallback: number, prefix = "LLM"): number {
  const n = Number(env("MAX_TOKENS", prefix));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function extraBody(prefix = "LLM"): Record<string, unknown> {
  const raw = env("EXTRA_BODY", prefix);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${prefix}_EXTRA_BODY must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}
