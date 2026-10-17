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
  ["That file is over 10 MB.", "file_too_large"],
  ["Please upload a PDF.", "invalid_file"],
  ["We couldn't open that PDF. Try a different file.", "unreadable"],
  [
    "That PDF has no readable text (it may be a scan). Try a PDF saved or exported from the original document.",
    "no_text",
  ],
  ["We couldn't read enough text from that letter.", "no_text"],
  ["That letter is too long for now.", "too_long"],
  [
    "That took longer than expected. Please try again in a moment.",
    "timed_out",
  ],
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

    // The hosting in front of the service turns away a request body over its
    // limit before the service sees it, with a page rather than JSON.
    if (response.status === 413) throw new AnalysisError("file_too_large");
    // It answers the same way, with a 504, when the service runs past its time
    // limit (maxDuration in app/api/analyze/route.ts). The service itself never
    // sends a 504.
    if (response.status === 504) throw new AnalysisError("timed_out");

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
