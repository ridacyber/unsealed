// owner: m
/**
 * Failure categories the UI knows how to explain.
 *
 * - upload_failed: the file never reached the service (connection, timeout).
 * - invalid_file: the service rejected the file itself (not a PDF, empty).
 * - file_too_large: the file was turned away for its size, by the service or
 *   by the hosting in front of it (an HTTP 413).
 * - unreadable: the PDF arrived but could not be opened.
 * - no_text: the PDF opened but held no text to read, as a scan does.
 * - too_long: the letter has more text than the service takes.
 * - timed_out: the service gave up because the analysis ran too long.
 * - processing_failed: anything else that went wrong while analyzing.
 */
export type AnalysisErrorCode =
  | "upload_failed"
  | "invalid_file"
  | "file_too_large"
  | "unreadable"
  | "no_text"
  | "too_long"
  | "timed_out"
  | "processing_failed";

export class AnalysisError extends Error {
  readonly code: AnalysisErrorCode;

  constructor(code: AnalysisErrorCode) {
    super(code);
    this.name = "AnalysisError";
    this.code = code;
  }
}

/** Anything unrecognised is reported as a general processing failure. */
export function toErrorCode(error: unknown): AnalysisErrorCode {
  return error instanceof AnalysisError ? error.code : "processing_failed";
}
