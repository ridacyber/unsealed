// owner: m
import type { Ref } from "react";
import type { TextRange } from "@/components/lib/citation";

interface HighlightedTextProps {
  text: string;
  /** The passage to mark, or null to show the text plain. */
  range: TextRange | null;
  markRef?: Ref<HTMLElement>;
  className?: string;
}

/** The letter's text, with one passage marked like a highlighter pen. */
export function HighlightedText({
  text,
  range,
  markRef,
  className = "",
}: HighlightedTextProps) {
  return (
    <p className={`font-quote break-words whitespace-pre-wrap ${className}`}>
      {range ? (
        <>
          {text.slice(0, range.start)}
          <mark
            ref={markRef}
            data-testid="letter-highlight"
            className="rounded-xs bg-highlighter/60 box-decoration-clone text-ink outline-2 outline-unsure-line/80"
          >
            {text.slice(range.start, range.end)}
          </mark>
          {text.slice(range.end)}
        </>
      ) : (
        text
      )}
    </p>
  );
}
