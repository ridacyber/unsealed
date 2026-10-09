// owner: m
interface EvidenceProps {
  quote: string;
  /** Whether the quote's place in the letter is known, so it can be shown. */
  located: boolean;
}

/**
 * The words behind a claim. The quote is always shown, but it is only called
 * the letter's own when its place in the letter's text is known.
 */
export function Evidence({ quote, located }: EvidenceProps) {
  return (
    <div className="mt-4">
      <figure className="rounded-lg border border-postal bg-sheet p-4 shadow-[inset_4px_0_0_var(--color-postal)]">
        <figcaption className="text-sm font-semibold text-ink-soft">
          {located ? "From your letter" : "Not matched to your letter's text"}
        </figcaption>
        <blockquote className="mt-1.5 font-quote text-[1.05rem] leading-relaxed break-words">
          &ldquo;{quote}&rdquo;
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
