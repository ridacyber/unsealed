// owner: m
"use client";

import { useEffect, useRef, useState } from "react";
import type { TextRange } from "@/components/lib/citation";
import { HighlightedText } from "./HighlightedText";

/** The evidence being inspected, and what to call the claim it supports. */
export interface EvidenceFocus {
  claim: string;
  /** Where the quote sits in the letter's text, when that is known. */
  range: TextRange | null;
}

interface DocumentPanelProps {
  /** The text read from the letter; citations point into it. */
  documentText: string;
  letterName: string;
  focus: EvidenceFocus | null;
}

export function DocumentPanel({
  documentText,
  letterName,
  focus,
}: DocumentPanelProps) {
  const [isLarge, setIsLarge] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLElement>(null);

  const hasText = documentText.trim().length > 0;
  const range = focus?.range ?? null;
  const rangeStart = range?.start;
  const rangeEnd = range?.end;

  // Bring the highlighted passage into view inside the panel, without
  // moving the rest of the page.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const mark = markRef.current;
    if (rangeStart === undefined || !scroller || !mark) return;
    const top =
      mark.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    scroller.scrollTo?.({ top: top - scroller.clientHeight / 3, left: 0 });
  }, [rangeStart, rangeEnd, isLarge]);

  return (
    <section
      id="your-letter"
      aria-labelledby="letter-heading"
      className="scroll-mt-4 overflow-hidden rounded-2xl border border-line bg-sheet"
    >
      <div className="px-5 py-4">
        <h2 id="letter-heading" className="font-display text-xl font-semibold">
          Your letter
        </h2>
        <p className="truncate text-sm text-ink-soft">
          {letterName} · the text as Unsealed read it
        </p>
      </div>

      <div
        ref={scrollerRef}
        className="envelope-lining-soft scroll-calm max-h-[75vh] overflow-auto p-4 sm:p-6 lg:max-h-[calc(100vh-15rem)]"
      >
        {hasText ? (
          <div className="bg-white p-5 shadow-[0_1px_3px_rgb(20_33_58/0.2),0_10px_24px_-12px_rgb(20_33_58/0.35)] sm:p-8">
            <HighlightedText
              text={documentText}
              range={range}
              markRef={markRef}
              className={
                isLarge ? "text-xl leading-loose" : "text-base leading-relaxed"
              }
            />
          </div>
        ) : (
          <p className="rounded-lg bg-sheet p-6 text-ink-soft">
            The text of this letter isn&rsquo;t available. The quotes beside
            each detail still show what the letter says.
          </p>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 border-t border-line px-5 py-4">
        <div aria-live="polite" className="text-ink-soft">
          <EvidenceCaption focus={focus} />
        </div>
        {hasText && (
          <button
            type="button"
            aria-pressed={isLarge}
            onClick={() => setIsLarge((large) => !large)}
            className="shrink-0 font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal"
          >
            Larger text
          </button>
        )}
      </div>
    </section>
  );
}

function EvidenceCaption({ focus }: { focus: EvidenceFocus | null }) {
  if (!focus) {
    return <p>Choose a detail to see where it appears in your letter.</p>;
  }

  if (focus.range) {
    return <p>Highlighted: the passage about {focus.claim}.</p>;
  }

  return (
    <p>
      The passage about {focus.claim} is quoted beside that detail. Its exact
      position in the letter isn&rsquo;t available, so nothing is highlighted.
    </p>
  );
}
