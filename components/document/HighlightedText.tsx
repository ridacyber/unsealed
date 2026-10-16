// owner: m
import type { Ref } from "react";
import {
  segmentLetter,
  splitLead,
  strongest,
  type LetterMark,
} from "./letterMarks";

interface HighlightedTextProps {
  text: string;
  /** Confirmed passages to mark; an empty list shows the text plain. */
  marks: readonly LetterMark[];
  /** Given to the first part of the active passage, to scroll it into view. */
  markRef?: Ref<HTMLElement>;
  className?: string;
}

/**
 * The letter's text, exactly as read, with its passages marked like a
 * highlighter pen: the one being inspected brightly, the passages other
 * answers rest on faintly. The marks only decorate the text; every character
 * is shown, in order.
 */
export function HighlightedText({
  text,
  marks,
  markRef,
  className = "",
}: HighlightedTextProps) {
  const segments = segmentLetter(text, marks);
  // The ref goes to the first part of the active passage.
  const firstActive = segments.find(
    (segment) => strongest(segment.marks)?.tone === "active",
  )?.start;

  return (
    <p className={`font-quote break-words whitespace-pre-wrap ${className}`}>
      {segments.map((segment) => {
        const lead = strongest(segment.marks);
        if (!lead) return segment.text;

        const isActive = lead.tone === "active";
        const giveRef = isActive && segment.start === firstActive;
        // A tag is shown once, where its passage begins.
        const tag =
          lead.tag && lead.range.start === segment.start ? lead.tag : undefined;
        // The tag is held to the passage's first character, so a line can't
        // end between the number and the words it numbers.
        const [first, rest] = tag ? splitLead(segment.text) : ["", segment.text];

        return (
          <mark
            key={segment.start}
            ref={giveRef ? markRef : undefined}
            data-testid={isActive ? "letter-highlight" : undefined}
            data-mark-active={isActive ? "" : undefined}
            data-tone={lead.tone}
            data-status={lead.status}
            className="rw-mark"
          >
            {tag ? (
              <>
                <span className="rw-mark-lead" data-tag={tag}>
                  {first}
                </span>
                {rest}
              </>
            ) : (
              segment.text
            )}
          </mark>
        );
      })}
    </p>
  );
}
