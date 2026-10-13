// owner: m
"use client";

import { Button } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";
import { useFocusOnMount } from "@/components/hooks/useFocusOnMount";
import type { AnalysisErrorCode } from "@/components/lib/errors";
import { MAX_FILE_SIZE_MB } from "@/components/lib/validateFile";

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

export function ErrorView({
  code,
  fileName,
  onRetry,
  onStartOver,
}: ErrorViewProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const { title, body, canRetry } = ERROR_COPY[code];

  return (
    <div className="mx-auto w-full max-w-xl px-5 pt-10 pb-20 sm:px-8 sm:pt-16">
      <span className="flex size-12 items-center justify-center rounded-full bg-alert-tint text-alert">
        <AlertIcon width={24} height={24} />
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 font-display text-4xl font-semibold tracking-tight text-balance"
      >
        {title}
      </h1>
      <p className="mt-4 text-lg text-ink-soft">{body}</p>
      <p className="mt-4 break-words text-ink-soft">
        File: <span className="font-semibold text-ink">{fileName}</span>
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {canRetry && <Button onClick={onRetry}>Try again</Button>}
        <Button
          variant={canRetry ? "secondary" : "primary"}
          onClick={onStartOver}
        >
          Choose a different file
        </Button>
      </div>
    </div>
  );
}
