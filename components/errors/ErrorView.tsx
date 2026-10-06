// owner: m
"use client";

import { Button } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";
import { useFocusOnMount } from "@/components/hooks/useFocusOnMount";
import type { AnalysisErrorCode } from "@/components/lib/errors";

interface ErrorCopy {
  title: string;
  body: string;
  /** Retrying the same file only helps when the file wasn't the problem. */
  canRetry: boolean;
}

export const ERROR_COPY: Record<AnalysisErrorCode, ErrorCopy> = {
  upload_failed: {
    title: "Your letter didn't upload",
    body: "The connection dropped before the file arrived. Check that you're online, then try again.",
    canRetry: true,
  },
  unreadable: {
    title: "We couldn't read this file",
    body: "The text isn't clear enough to make out. A sharper scan usually works, or a photo taken in good light with the whole page in frame.",
    canRetry: false,
  },
  processing_failed: {
    title: "Your letter wasn't analyzed",
    body: "Something went wrong on our side partway through. Try again in a moment. If it keeps happening, try a different copy of the letter.",
    canRetry: true,
  },
};

interface ErrorViewProps {
  code: AnalysisErrorCode;
  /** The service's own explanation, when it sent one. */
  detail?: string | null;
  fileName: string;
  onRetry: () => void;
  onStartOver: () => void;
}

export function ErrorView({
  code,
  detail = null,
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
      {detail && (
        <p className="mt-4 rounded-lg border border-line bg-sheet p-4 break-words text-ink-soft">
          What the service reported:{" "}
          <span className="text-ink">{detail}</span>
        </p>
      )}
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
