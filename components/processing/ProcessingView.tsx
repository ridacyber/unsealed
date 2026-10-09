// owner: m
"use client";

import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { useFocusOnMount } from "@/components/hooks/useFocusOnMount";
import { PROCESSING_STAGES, type ProcessingStage } from "@/components/lib/client";

export const STAGE_LABELS: Record<ProcessingStage, string> = {
  reading: "Reading your document",
  finding: "Finding important details",
  verifying: "Verifying evidence",
  preparing: "Preparing your summary",
};

type StageState = "done" | "current" | "upcoming";

function StageMarker({ state }: { state: StageState }) {
  if (state === "done") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-verified text-white">
        <CheckIcon width={16} height={16} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="relative flex size-7 items-center justify-center">
        <span className="stage-pulse absolute size-3 rounded-full bg-postal" />
        <span className="relative size-3 rounded-full bg-postal" />
      </span>
    );
  }
  return (
    <span className="flex size-7 items-center justify-center">
      <span className="size-3 rounded-full border-2 border-line" />
    </span>
  );
}

interface ProcessingViewProps {
  fileName: string;
  /** Null until the service reports a stage (or if it never does). */
  stage: ProcessingStage | null;
  onCancel: () => void;
}

export function ProcessingView({
  fileName,
  stage,
  onCancel,
}: ProcessingViewProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const currentIndex = stage ? PROCESSING_STAGES.indexOf(stage) : -1;

  return (
    <div className="mx-auto w-full max-w-xl px-5 pt-10 pb-20 sm:px-8 sm:pt-16">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-4xl font-semibold tracking-tight"
      >
        Going through your letter
      </h1>
      <p className="mt-3 text-lg break-words text-ink-soft">{fileName}</p>

      <div className="mt-8 rounded-2xl border border-line bg-sheet p-6 sm:p-8">
        {stage ? (
          <ol className="space-y-5">
            {PROCESSING_STAGES.map((name, index) => {
              const state: StageState =
                index < currentIndex
                  ? "done"
                  : index === currentIndex
                    ? "current"
                    : "upcoming";
              return (
                <li
                  key={name}
                  aria-current={state === "current" ? "step" : undefined}
                  className={`flex items-center gap-4 text-lg ${
                    state === "current"
                      ? "font-semibold"
                      : state === "upcoming"
                        ? "text-ink-soft"
                        : ""
                  }`}
                >
                  <StageMarker state={state} />
                  {STAGE_LABELS[name]}
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            <p className="flex items-center gap-4 text-lg font-semibold">
              <StageMarker state="current" />
              Working on your letter
            </p>
            <p className="mt-4 text-ink-soft">
              Unsealed is reading the text in your PDF and checking each answer
              against the letter&rsquo;s own words. This happens in one go, so
              there are no steps to show.
            </p>
          </>
        )}

        {/* Announces each stage once, without re-reading the whole list. */}
        <p role="status" className="sr-only">
          {stage ? `${STAGE_LABELS[stage]}…` : "Working on your letter…"}
        </p>
      </div>

      <p className="mt-6 text-ink-soft">
        This may take a little while. Keep this page open; your results will
        appear here when they&rsquo;re ready.
      </p>
      <Button variant="secondary" onClick={onCancel} className="mt-6">
        Cancel
      </Button>
    </div>
  );
}
