// owner: m
"use client";

import { useEffect, useRef, useState } from "react";
import type { TextRange } from "@/components/lib/citation";
import { HighlightedText } from "./HighlightedText";
import type { LetterMark } from "./letterMarks";

/**
 * The evidence being inspected: the quote behind one answer, or one of two
 * passages that may not agree.
 */
export type EvidenceFocus =
  | {
      kind: "claim";
      /** What to call the claim the quote supports. */
      claim: string;
      /** Where the quote sits in the letter's text, when that is known. */
      range: TextRange | null;
    }
  // A passage is only offered once its place in the letter is confirmed.
  | { kind: "conflict"; position: 1 | 2; range: TextRange };

interface DocumentPanelProps {
  /** The text read from the letter; citations point into it. */
  documentText: string;
  letterName: string;
  focus: EvidenceFocus | null;
  /** Confirmed passages to mark in the letter. */
  marks: readonly LetterMark[];
}

/**
 * The letter as Unsealed read it: a sheet of paper held in a tray on the
 * desk. It scrolls on its own, so a long letter never pushes the answers
 * away, and it brings the passage being inspected into view.
 */
export function DocumentPanel({
  documentText,
  letterName,
  focus,
  marks,
}: DocumentPanelProps) {
  const [isLarge, setIsLarge] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLElement>(null);

  const hasText = documentText.trim().length > 0;
  const range = focus?.range ?? null;
  const rangeStart = range?.start;
  const rangeEnd = range?.end;
  const hasResting = marks.some((mark) => mark.tone === "resting");
  const hasRelated = marks.some((mark) => mark.tone === "related");

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
      className="rw-tray scroll-mt-4"
    >
      <div className="rw-tray-head">
        <p className="rw-eyebrow">
          <span aria-hidden="true" className="eyebrow-rule" />
          The source
        </p>
        <h2 id="letter-heading" className="mt-2 font-display text-2xl font-semibold">
          Your letter
        </h2>
        <p className="mt-0.5 text-sm break-words text-fog lg:truncate">
          {letterName} · the text as Unsealed read it
        </p>
      </div>

      <div
        ref={scrollerRef}
        data-letter-scroller=""
        className="rw-scroller scroll-calm"
      >
        {hasText ? (
          <div data-letter-sheet="" className="rw-sheet">
            <HighlightedText
              text={documentText}
              marks={marks}
              markRef={markRef}
              className={
                isLarge ? "text-xl leading-loose" : "text-[0.95rem] leading-[1.75]"
              }
            />
          </div>
        ) : (
          <p className="rw-sheet rw-sheet-empty">
            The text of this letter isn&rsquo;t available, so the quotes
            beside each detail can&rsquo;t be checked against it.
          </p>
        )}
      </div>

      <div className="rw-tray-foot">
        <div className="min-w-0">
          <div aria-live="polite" className="text-fog-strong">
            <EvidenceCaption focus={focus} />
          </div>
          {hasText && (hasResting || focus) && (
            <ul className="rw-legend" aria-label="How the letter is marked">
              <li>
                <span aria-hidden="true" className="rw-swatch rw-swatch-active" />
                Highlighted: the passage you chose
              </li>
              {hasRelated && (
                <li>
                  <span aria-hidden="true" className="rw-swatch rw-swatch-related" />
                  Numbered: the two passages that may disagree
                </li>
              )}
              {hasResting && (
                <li>
                  <span aria-hidden="true" className="rw-swatch rw-swatch-resting" />
                  Underlined: passages the answers rest on
                </li>
              )}
            </ul>
          )}
        </div>
        {hasText && (
          <button
            type="button"
            aria-pressed={isLarge}
            onClick={() => setIsLarge((large) => !large)}
            className="rw-link-on-desk shrink-0"
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

  if (focus.kind === "conflict") {
    return (
      <p>Highlighted: passage {focus.position} of the 2 that may disagree.</p>
    );
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
