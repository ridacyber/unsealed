// owner: m
import type { AnalysisResult } from "@/lib/schema";

export const PROCESSING_STAGES = [
  "reading",
  "finding",
  "verifying",
  "preparing",
] as const;

export type ProcessingStage = (typeof PROCESSING_STAGES)[number];

export interface AnalyzeOptions {
  /** Abort to cancel an analysis in flight. */
  signal?: AbortSignal;
  /**
   * Called when the analysis moves to a new stage. A backend that can't report
   * progress simply never calls it; the UI then shows a generic waiting state.
   */
  onStage?: (stage: ProcessingStage) => void;
}

/**
 * How the UI asks for a letter to be analyzed. `mockClient` and `httpClient`
 * both implement it; `useAnalysis` picks one.
 */
export interface AnalysisClient {
  /** "mock" means results are canned and the file never leaves the browser. */
  readonly mode: "mock" | "live";
  /** Rejects with an `AnalysisError` when the document can't be analyzed. */
  analyze(file: File, options?: AnalyzeOptions): Promise<AnalysisResult>;
}
