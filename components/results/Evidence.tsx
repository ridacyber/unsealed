// owner: m
import type { PassageInContext } from "@/components/document/letterMarks";

interface EvidenceProps {
  quote: string;
  /** Whether the quote's place in the letter is known, so it can be shown. */
  located: boolean;
  /**
   * The confirmed passage with a little of the letter around it, as the
   * letter's own text. Only given when the passage is located.
   */
  context?: PassageInContext | null;
}

/**
 * The words behind a claim. A located passage is shown as the letter's own
 * text, with what comes before and after it, so it can be read in place even
 * where the letter itself is out of view. A quote that couldn't be matched is
 * shown as quoted and is never called the letter's own.
 */
export function Evidence({ quote, located, context }: EvidenceProps) {
  const inPlace = located && context ? context : null;

  return (
    <div className="rw-evidence">
      <figure
        className="rw-evidence-figure"
        data-located={located ? "" : undefined}
      >
        <figcaption className="text-sm font-semibold text-ink-soft">
          {located ? "From your letter" : "Not matched to your letter's text"}
        </figcaption>
        <blockquote className="mt-1.5 font-quote text-[1rem] leading-[1.7] break-words">
          {inPlace ? (
            <>
              <span className="rw-context">
                {inPlace.clippedBefore && "… "}
                {inPlace.before}
              </span>
              <mark className="rw-mark" data-tone="active">
                {inPlace.passage}
              </mark>
              <span className="rw-context">
                {inPlace.after}
                {inPlace.clippedAfter && " …"}
              </span>
            </>
          ) : (
            <>&ldquo;{quote}&rdquo;</>
          )}
        </blockquote>
        {!located && (
          <p className="mt-3 text-sm text-ink-soft">
            Unsealed couldn&rsquo;t match this quote to the text it read from
            your letter, so it can&rsquo;t show where it appears. The wording
            may not be exact. Check it against the original letter.
          </p>
        )}
      </figure>

      {located && (
        <a href="#your-letter" className="rw-link mt-3 inline-block lg:hidden">
          See it in your letter
        </a>
      )}
    </div>
  );
}
