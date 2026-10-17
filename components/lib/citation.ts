// owner: m
import type { AnalysisResult, Citation, Warning } from "@/lib/schema";
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

/** One of the two passages in a conflict, confirmed in the letter's text. */
export interface ConflictPassage {
  quote: string;
  range: TextRange;
}

/** Two passages of the letter that may not agree, in reading order. */
export interface VerifiedConflict {
  /** The service's account of how the two passages differ. */
  message: string;
  passages: [ConflictPassage, ConflictPassage];
}

/** A warning's message worth showing, or null for a blank one. */
function messageOf(warning: Warning): string | null {
  if (warning.kind !== "conflict") return null;
  return warning.message.trim() || null;
}

/** The conflict a warning describes, placed in the letter, or null. */
function placeConflict(
  documentText: string,
  warning: Warning,
): VerifiedConflict | null {
  const message = messageOf(warning);
  if (!message) return null;

  const passages: ConflictPassage[] = [];
  for (const citation of warning.quotes) {
    const quote = quoteOf(citation);
    const range = resolveCitation(documentText, citation);
    if (quote && range) passages.push({ quote, range });
  }
  if (passages.length !== 2) return null;

  const [first, second] = passages.sort(
    (a, b) => a.range.start - b.range.start,
  );
  // The same rule lib/contradictions.ts applies: one passage can't
  // disagree with itself.
  if (first.range.end > second.range.start) return null;

  return { message, passages: [first, second] };
}

/**
 * The conflicts that can be shown in the letter: those with something to say
 * and two separate passages, each confirmed by `resolveCitation`. A conflict
 * that fails any of this is never marked in the letter, on a guess or by
 * half; `unplacedConflicts` keeps its report.
 */
export function verifiedConflicts(result: AnalysisResult): VerifiedConflict[] {
  const conflicts: VerifiedConflict[] = [];
  for (const warning of result.warnings ?? []) {
    const conflict = placeConflict(result.documentText, warning);
    if (conflict) conflicts.push(conflict);
  }
  return conflicts;
}

/** A conflict the service reported whose passages can't be shown in the letter. */
export interface UnplacedConflict {
  /** The service's account of the conflict, as it gave it. */
  message: string;
  /** The quotes it gave, each with whether it is found in the letter's text. */
  quotes: { quote: string; located: boolean }[];
}

/**
 * The reported conflicts that `verifiedConflicts` can't place: a passage isn't
 * found where the service says it is, or the two overlap. The report still
 * stands, so it is kept, though nothing of it is marked in the letter. A
 * warning with a blank message has nothing to say and is left out.
 */
export function unplacedConflicts(result: AnalysisResult): UnplacedConflict[] {
  const unplaced: UnplacedConflict[] = [];
  for (const warning of result.warnings ?? []) {
    const message = messageOf(warning);
    if (!message || placeConflict(result.documentText, warning)) continue;

    const quotes: UnplacedConflict["quotes"] = [];
    for (const citation of warning.quotes) {
      const quote = quoteOf(citation);
      if (!quote) continue;
      const located = resolveCitation(result.documentText, citation) !== null;
      quotes.push({ quote, located });
    }
    unplaced.push({ message, quotes });
  }
  return unplaced;
}
