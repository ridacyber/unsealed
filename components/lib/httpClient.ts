// owner: m
import { AnalyzeResponseSchema } from "@/lib/schema";
import type { AnalysisClient } from "./client";
import { AnalysisError, type AnalysisErrorCode } from "./errors";

/**
 * The service's wording for the failures a person can do something about, as
 * written in app/api/analyze/route.ts, lib/extract.ts and lib/explain.ts.
 *
 * The text is only a lookup key and is never shown. A message that isn't
 * listed here is reported as a general failure, which keeps technical details
 * from the service off the screen.
 */
const SERVICE_ERRORS: ReadonlyMap<string, AnalysisErrorCode> = new Map<
  string,
  AnalysisErrorCode
>([
  ["No file was uploaded.", "invalid_file"],
  ["That file is empty.", "invalid_file"],
  ["That file is over 10 MB.", "invalid_file"],
  ["Please upload a PDF, JPG, or PNG.", "invalid_file"],
  // Only a file that isn't a PDF reaches the service's image handling.
  [
    "Photo uploads aren't available yet. Please upload a text PDF.",
    "invalid_file",
  ],
  ["We couldn't read that image. Try a clearer photo or a PDF.", "invalid_file"],
  [
    "We couldn't find readable text in that image. Try a clearer, well-lit photo.",
    "invalid_file",
  ],
  ["We couldn't open that PDF. Try a different file.", "unreadable"],
  [
    "That PDF looks like a scan with no readable text. Try uploading a photo of it instead.",
    "no_text",
  ],
  ["We couldn't read enough text from that letter.", "no_text"],
  ["That letter is too long for now.", "too_long"],
]);

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
      throw new AnalysisError(
        SERVICE_ERRORS.get(parsed.data.error) ?? "processing_failed",
      );
    }
    return parsed.data.result;
  },
};
