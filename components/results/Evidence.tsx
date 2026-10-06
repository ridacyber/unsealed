// owner: m
interface EvidenceProps {
  quote: string;
  /** Whether the quote's place in the letter is known, so it can be shown. */
  located: boolean;
}

/**
 * The letter's own words behind a claim. Works with or without a position:
 * the quote is always shown.
 */
export function Evidence({ quote, located }: EvidenceProps) {
  return (
    <div className="mt-4">
      <figure className="rounded-lg border border-postal bg-sheet p-4 shadow-[inset_4px_0_0_var(--color-postal)]">
        <figcaption className="text-sm font-semibold text-ink-soft">
          From your letter
        </figcaption>
        <blockquote className="mt-1.5 font-quote text-[1.05rem] leading-relaxed break-words">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </figure>

      {located && (
        <a
          href="#your-letter"
          className="mt-3 inline-block font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal lg:hidden"
        >
          See it in your letter
        </a>
      )}
    </div>
  );
}
