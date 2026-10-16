// owner: m
// Run with: npx tsx --test components/results/connector.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { connectorGeometry, type Box, type ConnectorInput } from "./connector";

const box = (left: number, top: number, width: number, height: number): Box => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

/** A card on the left, the letter on the right, a passage in view. */
const base: ConnectorInput = {
  source: box(40, 300, 500, 200),
  sheet: box(700, 120, 480, 1200),
  scroller: box(680, 100, 520, 600),
  lines: [box(744, 400, 300, 20), box(744, 420, 120, 20)],
  viewportHeight: 900,
  origin: { left: 0, top: 0 },
};

test("a thread runs from the card's edge to a bracket in the letter's margin", () => {
  const c = connectorGeometry(base);
  assert.ok(c);
  assert.equal(c.from.x, 540);
  assert.equal(c.from.y, 340);
  // The bracket sits in the margin, left of the words, and spans both lines.
  assert.equal(c.bracket, "M717 400 H712 V440 H717");
  assert.ok(c.to.x < 744, "the thread ends before the text begins");
  assert.equal(c.to.y, 420);
  assert.match(c.d, /^M540 340 C/);
});

test("positions are relative to the drawing's own box", () => {
  const c = connectorGeometry({ ...base, origin: { left: 20, top: 100 } });
  assert.ok(c);
  assert.equal(c.from.x, 520);
  assert.equal(c.from.y, 240);
  assert.equal(c.bracket, "M697 300 H692 V340 H697");
});

test("no thread when the card and the letter aren't side by side", () => {
  assert.equal(
    connectorGeometry({ ...base, source: box(40, 300, 680, 200) }),
    null,
  );
});

test("no thread when the card is out of the window", () => {
  assert.equal(connectorGeometry({ ...base, source: box(40, -300, 500, 200) }), null);
  assert.equal(connectorGeometry({ ...base, source: box(40, 950, 500, 200) }), null);
});

test("no thread when the passage is scrolled out of the letter's window", () => {
  assert.equal(
    connectorGeometry({ ...base, lines: [box(744, 760, 300, 20)] }),
    null,
  );
  assert.equal(connectorGeometry({ ...base, lines: [] }), null);
  assert.equal(
    connectorGeometry({ ...base, lines: [box(744, 400, 0, 20)] }),
    null,
  );
});

test("a passage partly out of view is bracketed only where it can be seen", () => {
  const c = connectorGeometry({
    ...base,
    lines: [box(744, 680, 300, 20), box(744, 700, 300, 20), box(744, 720, 300, 20)],
  });
  assert.ok(c);
  assert.equal(c.bracket, "M717 680 H712 V700 H717");
});

test("a short card's thread leaves from its middle", () => {
  const c = connectorGeometry({ ...base, source: box(40, 300, 500, 50) });
  assert.ok(c);
  assert.equal(c.from.y, 325);
});
