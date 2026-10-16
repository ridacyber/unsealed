// owner: m
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { useFocusOnMount } from "@/components/hooks/useFocusOnMount";
import { PROCESSING_STAGES, type ProcessingStage } from "@/components/lib/client";
import { useResultsDropGuard } from "@/components/results/dropGuard";
import { DropNote } from "./DropNote";
import { SealedLetter } from "./SealedLetter";

export const STAGE_LABELS: Record<ProcessingStage, string> = {
  reading: "Reading your document",
  finding: "Finding important details",
  verifying: "Verifying evidence",
  preparing: "Preparing your summary",
};

/** How long a wait runs before the view says it is taking longer than expected. */
export const LONG_WAIT_SECONDS = 30;

export const LONG_WAIT_MESSAGE =
  "This is taking longer than expected. You can keep waiting or cancel.";

/** Said when a file is dropped while a letter is being read. */
export const DROP_WHILE_WAITING =
  "A file dropped here isn’t opened, so the letter you sent keeps going. To read a different letter, cancel first.";

/** Whole seconds since the view appeared, read from the device's clock. */
function useElapsedSeconds(): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    // Ticks faster than once a second, and reads the clock each time, so the
    // figure stays right when the browser slows timers in a background tab.
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  return seconds;
}

export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const secondsPart = `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  if (minutes === 0) return secondsPart;
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ${secondsPart}`;
}

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
  /** True for a sample prepared in advance: nothing is being analyzed. */
  prepared?: boolean;
  onCancel: () => void;
}

/**
 * The wait, on the midnight desk: the sealed letter under a slow light, and a
 * paper slip that says plainly what is known. The live service reports no
 * stages, so none are shown, and there is no progress bar: the only figure is
 * the time that has passed.
 */
export function ProcessingView({
  fileName,
  stage,
  prepared = false,
  onCancel,
}: ProcessingViewProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const elapsedSeconds = useElapsedSeconds();
  const refusingDrop = useResultsDropGuard();
  const isLongWait = !prepared && elapsedSeconds >= LONG_WAIT_SECONDS;
  const currentIndex = stage ? PROCESSING_STAGES.indexOf(stage) : -1;

  return (
    <div className="pw-page">
      <div className="pw-stage">
        <div className="pw-head">
          <p className="rw-eyebrow">
            <span aria-hidden="true" className="eyebrow-rule" />
            Your letter
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="rw-title">
            {prepared ? "Opening prepared sample" : "Going through your letter"}
          </h1>
          <p className="pw-file">{fileName}</p>
        </div>

        <div className="pw-visual">
          <SealedLetter fileName={fileName} />
        </div>

        <div className="pw-body">
          <div className="rw-slip pw-paper pw-slip">
            {prepared ? (
              <p className="text-lg">
                This sample was prepared in advance. No analysis is being run.
              </p>
            ) : stage ? (
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
                <p className="flex items-center gap-3 text-lg font-semibold">
                  <StageMarker state="current" />
                  Working on your letter
                </p>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-soft">
                  Unsealed is reading the text in your PDF and checking each
                  answer against the letter&rsquo;s own words. The whole letter
                  is handled together, so your results will appear all at
                  once.
                </p>
              </>
            )}

            {/* Announces each stage once, without re-reading the whole list. */}
            <p role="status" className="sr-only">
              {prepared
                ? "Opening prepared sample…"
                : stage
                  ? `${STAGE_LABELS[stage]}…`
                  : "Working on your letter…"}
            </p>

            {!prepared && (
              <div className="pw-slip-foot">
                {/* A timer is silent to screen readers unless they go and read it. */}
                <p className="text-ink-soft">
                  Time so far:{" "}
                  <span role="timer" className="font-semibold text-ink tabular-nums">
                    {formatElapsed(elapsedSeconds)}
                  </span>
                </p>
                {/* The message's room is kept from the start, by an unseen copy
                    in the same place, so the slip doesn't grow at 30 seconds
                    and nothing beside or below it moves. */}
                <div className="pw-notice-slot">
                  <p aria-hidden="true" className="pw-long-wait pw-reserve">
                    {LONG_WAIT_MESSAGE}
                  </p>
                  {/* Stays mounted and empty so that filling it in is announced, once. */}
                  <p role="status" className={isLongWait ? "pw-long-wait" : ""}>
                    {isLongWait ? LONG_WAIT_MESSAGE : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!prepared && (
            <p className="pw-aside-note">
              This can take a little while, and some letters take longer than
              others. Keep this page open; your results will appear here when
              they&rsquo;re ready.
            </p>
          )}
          <Button variant="secondary" onClick={onCancel} className="mt-6">
            Cancel
          </Button>
        </div>

        <DropNote on={refusingDrop}>{DROP_WHILE_WAITING}</DropNote>
      </div>
    </div>
  );
}
