// owner: m
/**
 * Geometry for the threads that tie an answer to the words it rests on.
 * Pure functions, so the curves can be tested without a browser.
 */

export interface Point {
  x: number;
  y: number;
}

/** The shortest pull a curve takes from each end, so short threads still bend. */
const MIN_PULL = 24;

/**
 * A curve from a passage to an answer: it leaves the passage level, bends,
 * and arrives level at the answer, so neither end looks like it was cut.
 */
export function threadPath(from: Point, to: Point): string {
  const pull = Math.max(MIN_PULL, Math.abs(to.x - from.x) * 0.5);
  const direction = to.x >= from.x ? 1 : -1;
  const c1 = { x: from.x + pull * direction, y: from.y };
  const c2 = { x: to.x - pull * direction, y: to.y };
  return `M${round(from.x)} ${round(from.y)} C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(to.x)} ${round(to.y)}`;
}

/**
 * Where a thread leaves a passage that may wrap over several lines: the end
 * of the line that reaches furthest toward the answers, so the thread never
 * crosses the words that follow the passage.
 */
export function passageEnd(lines: ReadonlyArray<DOMRectReadOnly>): {
  right: number;
  middle: number;
} | null {
  let furthest: DOMRectReadOnly | null = null;
  for (const line of lines) {
    if (line.width <= 0) continue;
    if (!furthest || line.right > furthest.right) furthest = line;
  }
  return furthest
    ? { right: furthest.right, middle: furthest.top + furthest.height / 2 }
    : null;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
