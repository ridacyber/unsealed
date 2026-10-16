// owner: m
import type { TextRange } from "@/components/lib/citation";

/**
 * How a passage is marked in the letter:
 * - active:  the evidence being inspected right now;
 * - related: the other passage of a conflict being inspected;
 * - resting: a passage some answer rests on, shown faintly at all times.
 */
export type MarkTone = "active" | "related" | "resting";

/** A passage to mark. Ranges must already be confirmed (see citation.ts). */
export interface LetterMark {
  range: TextRange;
  tone: MarkTone;
  /** Unsure evidence is marked differently from verified evidence. */
  status?: "verified" | "unsure";
  /** A short label shown before the passage, e.g. "1" for a conflict side. */
  tag?: string;
}

/** A run of the letter's text, and the marks that cover all of it. */
export interface LetterSegment {
  start: number;
  end: number;
  text: string;
  marks: LetterMark[];
}

const TONE_ORDER: Record<MarkTone, number> = { active: 0, related: 1, resting: 2 };

/** The mark that decides how a segment looks: active over related over resting. */
export function strongest(marks: readonly LetterMark[]): LetterMark | null {
  let best: LetterMark | null = null;
  for (const mark of marks) {
    if (!best || TONE_ORDER[mark.tone] < TONE_ORDER[best.tone]) best = mark;
  }
  return best;
}

function fits(range: TextRange, length: number): boolean {
  return (
    Number.isInteger(range.start) &&
    Number.isInteger(range.end) &&
    range.start >= 0 &&
    range.end > range.start &&
    range.end <= length
  );
}

/**
 * Splits the letter at every edge of every mark, so overlapping passages can
 * each be shown. Nothing is searched for: a mark whose range doesn't fit the
 * text is dropped rather than moved. The segments, joined, are the letter's
 * text exactly.
 */
export function segmentLetter(
  text: string,
  marks: readonly LetterMark[],
): LetterSegment[] {
  const usable = marks.filter((mark) => fits(mark.range, text.length));
  const edges = new Set<number>([0, text.length]);
  for (const { range } of usable) {
    edges.add(range.start);
    edges.add(range.end);
  }
  const points = [...edges].sort((a, b) => a - b);

  const segments: LetterSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (end <= start) continue;
    segments.push({
      start,
      end,
      text: text.slice(start, end),
      marks: usable.filter(
        ({ range }) => range.start <= start && range.end >= end,
      ),
    });
  }
  return segments;
}

/**
 * Splits off the first character of a passage, so its tag can be kept on the
 * same line as the words it labels. Whitespace is never split off: it would
 * lose its line breaks in the unwrappable part, so the tag then stands alone.
 * The two parts, joined, are the text exactly.
 */
export function splitLead(text: string): [lead: string, rest: string] {
  const first = text.codePointAt(0);
  if (first === undefined || /\s/.test(String.fromCodePoint(first))) {
    return ["", text];
  }
  const lead = String.fromCodePoint(first);
  return [lead, text.slice(lead.length)];
}

/** A passage with a little of the letter on either side of it. */
export interface PassageInContext {
  before: string;
  passage: string;
  after: string;
  /** Whether text was left out before or after the shown context. */
  clippedBefore: boolean;
  clippedAfter: boolean;
}

/**
 * The confirmed passage, as the letter's own text, with up to `reach`
 * characters either side, cut at a word boundary. Used where there is no room
 * to show the whole letter beside the answer.
 */
export function passageInContext(
  text: string,
  range: TextRange,
  reach = 80,
): PassageInContext | null {
  if (!fits(range, text.length)) return null;

  let from = Math.max(0, range.start - reach);
  if (from > 0) {
    const space = text.indexOf(" ", from);
    from = space === -1 || space >= range.start ? range.start : space + 1;
  }
  let to = Math.min(text.length, range.end + reach);
  if (to < text.length) {
    const space = text.lastIndexOf(" ", to);
    to = space === -1 || space <= range.end ? range.end : space;
  }

  return {
    before: text.slice(from, range.start),
    passage: text.slice(range.start, range.end),
    after: text.slice(range.end, to),
    clippedBefore: from > 0,
    clippedAfter: to < text.length,
  };
}
