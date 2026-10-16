// owner: m
"use client";

import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";
import { useFocusOnMount } from "@/components/hooks/useFocusOnMount";
import type { AnalysisErrorCode } from "@/components/lib/errors";
import { MAX_FILE_SIZE_MB } from "@/components/lib/validateFile";
import { DropNote } from "@/components/processing/DropNote";
import { SealedLetter } from "@/components/processing/SealedLetter";
import { useResultsDropGuard } from "@/components/results/dropGuard";

interface ErrorCopy {
  title: string;
  body: string;
  /** Retrying the same file only helps when the file wasn't the problem. */
  canRetry: boolean;
}

export const ERROR_COPY: Record<AnalysisErrorCode, ErrorCopy> = {
  upload_failed: {
    title: "The connection failed",
    body: "We couldn't retrieve your analysis results. Check your connection before trying again. The request may have continued processing.",
    canRetry: true,
  },
  invalid_file: {
    title: "This file can't be used",
    body: `Unsealed reads PDF files up to ${MAX_FILE_SIZE_MB} MB. This one is empty, too large, or isn't really a PDF. Choose a PDF copy of your letter.`,
    canRetry: false,
  },
  file_too_large: {
    title: "This file is too large to send",
    body: `Unsealed reads PDF files up to ${MAX_FILE_SIZE_MB} MB. Choose a smaller PDF copy of your letter, or save the letter again at a lower quality.`,
    canRetry: false,
  },
  unreadable: {
    title: "We couldn't open this PDF",
    body: "The file may be damaged or password-protected. Try downloading or saving the letter again, then choose the new file.",
    canRetry: false,
  },
  no_text: {
    title: "This PDF has no text we can read",
    body: "It looks like a scan or photo of the pages saved as a PDF. Unsealed reads the text inside a PDF and can't read pictures of text. If you have the original digital copy of the letter, try that instead.",
    canRetry: false,
  },
  too_long: {
    title: "This letter is too long",
    body: "Unsealed can only read shorter letters for now. If the PDF holds several documents, try one with just the letter.",
    canRetry: false,
  },
  timed_out: {
    title: "That took longer than expected",
    body: "We stopped before your letter was finished, so there are no results to show. This is usually temporary and not a problem with your file. Please try again in a moment.",
    canRetry: true,
  },
  processing_failed: {
    title: "Your letter wasn't analyzed",
    body: "Something went wrong on our side. Try again in a moment. If it keeps happening, try a different copy of the letter.",
    canRetry: true,
  },
};

interface ErrorViewProps {
  code: AnalysisErrorCode;
  fileName: string;
  onRetry: () => void;
  onStartOver: () => void;
}

/** Where the trouble lies, which sets the slip's label and colour. */
export type ErrorKind = "connection" | "time" | "file" | "service";

export const ERROR_KIND: Record<AnalysisErrorCode, ErrorKind> = {
  upload_failed: "connection",
  timed_out: "time",
  invalid_file: "file",
  file_too_large: "file",
  unreadable: "file",
  no_text: "file",
  too_long: "file",
  processing_failed: "service",
};

export const ERROR_KIND_LABEL: Record<ErrorKind, string> = {
  connection: "Connection problem",
  time: "Ran out of time",
  file: "A problem with this file",
  service: "A problem on our side",
};

const STAMP_TONE: Record<ErrorKind, "temporary" | "file" | "service"> = {
  connection: "temporary",
  time: "temporary",
  file: "file",
  service: "service",
};

/** Said beside "Try again", before anything is sent. */
export const RETRY_NOTE =
  "Trying again sends the same file for a new analysis.";

/** Said when a file is dropped on the page. */
export const DROP_ON_ERROR =
  "A file dropped here isn’t opened. To read a different letter, choose “Choose a different file”.";

/**
 * A letter that came back without results, on the midnight desk: the
 * returned envelope, and a paper slip with what went wrong and what to do.
 * The wording is the same for each failure as before; only the setting is
 * new. Nothing is retried until the person asks.
 */
export function ErrorView({
  code,
  fileName,
  onRetry,
  onStartOver,
}: ErrorViewProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const retryNoteId = useId();
  const refusingDrop = useResultsDropGuard();
  const { title, body, canRetry } = ERROR_COPY[code];
  const kind = ERROR_KIND[code];

  return (
    <div className="pw-page">
      <div className="pw-stage">
        <div className="pw-head">
          <p className="rw-eyebrow">
            <span aria-hidden="true" className="eyebrow-rule" />
            {ERROR_KIND_LABEL[kind]}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="rw-title">
            {title}
          </h1>
        </div>

        <div className="pw-visual">
          <SealedLetter fileName={fileName} returned tone={STAMP_TONE[kind]} />
        </div>

        <div className="pw-body">
          <div className="rw-slip pw-paper pw-slip pw-returned" data-kind={kind}>
            <span aria-hidden="true" className="pw-returned-icon">
              <AlertIcon width={22} height={22} />
            </span>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{body}</p>
            <p className="mt-4 break-words text-ink-soft">
              File: <span className="font-semibold text-ink">{fileName}</span>
            </p>

            <div className="pw-actions">
              {canRetry && (
                <Button onClick={onRetry} aria-describedby={retryNoteId}>
                  Try again
                </Button>
              )}
              <Button
                variant={canRetry ? "secondary" : "primary"}
                onClick={onStartOver}
              >
                Choose a different file
              </Button>
            </div>
            {canRetry && (
              <p id={retryNoteId} className="mt-3 text-sm text-ink-soft">
                {RETRY_NOTE}
              </p>
            )}
          </div>
        </div>

        <DropNote on={refusingDrop}>{DROP_ON_ERROR}</DropNote>
      </div>
    </div>
  );
}
