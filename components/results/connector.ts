// owner: m
import { threadPath, type Point } from "@/components/landing/threads";

/** The parts of a rectangle the connector needs; a DOMRect has them all. */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ConnectorInput {
  /** The answer or passage card the evidence belongs to. */
  source: Box;
  /** The sheet of paper the letter is printed on. */
  sheet: Box;
  /** The scrolling window the sheet is seen through. */
  scroller: Box;
  /** The line boxes of the marked passage, in reading order. */
  lines: readonly Box[];
  /** The browser window's height, to tell whether the source is in view. */
  viewportHeight: number;
  /** The box the drawing is positioned in; results are relative to it. */
  origin: { left: number; top: number };
}

export interface Connector {
  /** The thread, from the card's edge to the bracket. */
  d: string;
  /** The bracket in the letter's margin, spanning the passage's lines. */
  bracket: string;
  from: Point;
  to: Point;
}

/** How far the bracket sits into the sheet's left margin. */
const BRACKET_INSET = 12;
/** The length of the bracket's ends, which point at the text. */
const BRACKET_TICK = 5;
/** The thread leaves the card this far below its top, near its question. */
const SOURCE_DROP = 40;
/** Room needed between card and letter for a thread to be worth drawing. */
const MIN_GAP = 16;

/**
 * Where to draw the thread that ties a card to its passage in the letter, or
 * null when it shouldn't be drawn:
 * - the card and the letter aren't side by side (a phone, a narrow window);
 * - the card is out of the window;
 * - no line of the passage can be seen through the letter's window.
 *
 * The thread ends at a bracket in the margin, never on the words, so it
 * can't cross the text around the passage. It only ever points at lines the
 * page has already marked; it doesn't decide what the passage is.
 */
export function connectorGeometry({
  source,
  sheet,
  scroller,
  lines,
  viewportHeight,
  origin,
}: ConnectorInput): Connector | null {
  if (source.right + MIN_GAP > sheet.left) return null;
  if (source.bottom <= 0 || source.top >= viewportHeight) return null;

  const visible = lines.filter(
    (line) =>
      line.right > line.left &&
      line.bottom > scroller.top &&
      line.top < scroller.bottom,
  );
  if (visible.length === 0) return null;

  const top = Math.max(scroller.top, Math.min(...visible.map((l) => l.top)));
  const bottom = Math.min(
    scroller.bottom,
    Math.max(...visible.map((l) => l.bottom)),
  );
  const bracketX = sheet.left + BRACKET_INSET - origin.left;
  const y1 = top - origin.top;
  const y2 = bottom - origin.top;

  const sourceY = Math.min(
    source.top + SOURCE_DROP,
    (source.top + source.bottom) / 2,
  );
  const from = { x: source.right - origin.left, y: sourceY - origin.top };
  const to = { x: bracketX - 2, y: (y1 + y2) / 2 };

  return {
    d: threadPath(from, to),
    bracket: `M${r(bracketX + BRACKET_TICK)} ${r(y1)} H${r(bracketX)} V${r(y2)} H${r(bracketX + BRACKET_TICK)}`,
    from,
    to,
  };
}

function r(value: number): number {
  return Math.round(value * 10) / 10;
}
