// owner: m
/**
 * Failure categories the UI knows how to explain.
 *
 * - upload_failed: the file never reached the service (connection, timeout).
 * - unreadable: the file arrived but no text could be read from it.
 * - processing_failed: anything else that went wrong while analyzing.
 */
export type AnalysisErrorCode =
  "upload_failed" | "unreadable" | "processing_failed";

export class AnalysisError extends Error {
  readonly code: AnalysisErrorCode;
  /** The service's own account of what went wrong, when it gave one. */
  readonly detail: string | null;

  constructor(code: AnalysisErrorCode, detail: string | null = null) {
    super(detail ?? code);
    this.name = "AnalysisError";
    this.code = code;
    this.detail = detail;
  }
}

/** Anything unrecognised is reported as a general processing failure. */
export function toErrorCode(error: unknown): AnalysisErrorCode {
  return error instanceof AnalysisError ? error.code : "processing_failed";
}

export function toErrorDetail(error: unknown): string | null {
  return error instanceof AnalysisError ? error.detail : null;
}
