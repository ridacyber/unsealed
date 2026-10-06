// owner: m
import { AnalyzeResponseSchema } from "@/lib/schema";
import type { AnalysisClient } from "./client";
import { AnalysisError } from "./errors";

/**
 * Talks to POST /api/analyze as described in lib/schema.ts: a multipart form
 * with the letter in the "file" field, answered by an `AnalyzeResponse`.
 *
 * The endpoint reports no progress, so `onStage` is never called and the
 * processing view shows its generic waiting state.
 */
export const httpClient: AnalysisClient = {
  mode: "live",

  async analyze(file, { signal } = {}) {
    const body = new FormData();
    body.append("file", file);

    let response: Response;
    try {
      response = await fetch("/api/analyze", { method: "POST", body, signal });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new AnalysisError("upload_failed");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new AnalysisError("processing_failed");
    }

    const parsed = AnalyzeResponseSchema.safeParse(payload);
    if (!parsed.success) throw new AnalysisError("processing_failed");
    if (!parsed.data.ok) {
      throw new AnalysisError("processing_failed", parsed.data.error);
    }
    return parsed.data.result;
  },
};
