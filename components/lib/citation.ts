// owner: m
import type { Citation } from "@/lib/schema";
import { indexDocument } from "@/lib/verify";

/** A span of `documentText`, end-exclusive like `String.slice`. */
export interface TextRange {
  start: number;
  end: number;
}

/**
 * Text reduced the way lib/verify.ts reduces it before looking for a quote:
 * whitespace, letter case, and curly or straight quotes and dashes are
 * ignored. Using its own reduction keeps the two checks from disagreeing.
 */
function comparable(text: string): string {
  return indexDocument(text).out;
}

/** The quote to show for a citation, or null when there is nothing to show. */
export function quoteOf(citation: Citation | null): string | null {
  const quote = citation?.quote.trim();
  return quote ? quote : null;
}

/**
 * Where a citation sits in the letter's text, or null when its offsets can't
 * be trusted: missing (start is -1), out of bounds, or pointing at words that
 * aren't the quote. The quote is still shown in that case; only the highlight
 * is dropped, so the letter is never marked in the wrong place.
 *
 * The offsets are only ever confirmed, never searched for: the span returned
 * is the one the service gave, or nothing.
 */
export function resolveCitation(
  documentText: string,
  citation: Citation,
): TextRange | null {
  const { quote, start, end } = citation;
  if (start < 0 || end <= start || end > documentText.length) return null;
  const wanted = comparable(quote);
  if (!wanted || comparable(documentText.slice(start, end)) !== wanted) {
    return null;
  }
  return { start, end };
}
