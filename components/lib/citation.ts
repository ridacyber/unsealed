// owner: m
import type { Citation } from "@/lib/schema";

/** A span of `documentText`, end-exclusive like `String.slice`. */
export interface TextRange {
  start: number;
  end: number;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
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
 */
export function resolveCitation(
  documentText: string,
  citation: Citation,
): TextRange | null {
  const { quote, start, end } = citation;
  if (start < 0 || end <= start || end > documentText.length) return null;
  const cited = collapseWhitespace(documentText.slice(start, end));
  if (cited !== collapseWhitespace(quote)) return null;
  return { start, end };
}
