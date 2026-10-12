// owner: shared (talk before changing)
import { z } from "zod";

// Where in the letter a claim came from. The MODEL returns only `quote`;
// verify.ts finds it in documentText and fills start/end (or downgrades the claim).
export const CitationSchema = z.object({
  quote: z.string(),
  start: z.number().int(), // character offset into documentText, -1 if not found
  end: z.number().int(),
});

// verified  = quote found in the letter, claim shown normally
// unsure    = model wasn't confident or quote didn't check out -> "check with a person"
// not_found = the letter doesn't say
export const FieldStatusSchema = z.enum(["verified", "unsure", "not_found"]);

export const FieldSchema = z.object({
  status: FieldStatusSchema,
  value: z.string().nullable(),      // shown to the user, e.g. "$1,250.00"
  normalized: z.string().nullable(), // for scoring, e.g. "1250.00" or "2026-11-15"
  citation: CitationSchema.nullable(),
  confidence: z.number().min(0).max(1),
  note: z.string().nullable(),       // why we're unsure, shown to the user
});

export const FIELD_NAMES = ["amountOwed", "deadline", "requiredAction", "consequence"] as const;
export const FieldNameSchema = z.enum(FIELD_NAMES);

export const MetricsSchema = z.object({
  model: z.string(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  latencyMs: z.number(),
  costUsd: z.number(),
  // Contradiction check, reported separately. Optional so older clients keep working.
  checkStatus: z.enum(["ok", "failed"]).optional(),
  checkModel: z.string().optional(),
  checkInputTokens: z.number().int().optional(),
  checkOutputTokens: z.number().int().optional(),
  checkLatencyMs: z.number().optional(),
  checkCostUsd: z.number().optional(),
});

// A contradiction found inside the letter: two passages that cannot both be followed or both be true.
// Only included when the backend found BOTH passages in the letter text.
export const WarningSchema = z.object({
  kind: z.literal("conflict"),
  message: z.string(),
  quotes: z.tuple([CitationSchema, CitationSchema]),
});

export const AnalysisResultSchema = z.object({
  id: z.string(),
  documentType: z.string(),  // e.g. "Financial aid notice"
  documentText: z.string(),  // text we read from the letter; citations point into this
  summary: z.string(),       // plain-language summary
  fields: z.object({
    amountOwed: FieldSchema,
    deadline: FieldSchema,
    requiredAction: FieldSchema,
    consequence: FieldSchema,
  }),
  overall: z.enum(["ok", "partial", "abstained"]), // partial = at least one field unsure
  warnings: z.array(WarningSchema).optional(), // contradictions in the letter, each with both passages
  disclaimer: z.string(),
  metrics: MetricsSchema,
});

// POST /api/analyze  (multipart form, field name "file") returns this
export const AnalyzeResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), result: AnalysisResultSchema }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

export type Citation = z.infer<typeof CitationSchema>;
export type FieldStatus = z.infer<typeof FieldStatusSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type FieldName = z.infer<typeof FieldNameSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type Warning = z.infer<typeof WarningSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
