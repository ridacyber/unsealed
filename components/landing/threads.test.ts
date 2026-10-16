// owner: m
// Run with: npx tsx --test components/landing/threads.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { passageEnd, threadPath } from "./threads";

function rect(x: number, y: number, width: number, height: number) {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON() {
      return this;
    },
  } as DOMRectReadOnly;
}

test("a thread starts at the passage and ends at the answer", () => {
  const d = threadPath({ x: 10, y: 20 }, { x: 110, y: 80 });
  assert.match(d, /^M10 20 C/);
  assert.match(d, / 110 80$/);
});

test("a thread leaves and arrives level", () => {
  const d = threadPath({ x: 0, y: 0 }, { x: 200, y: 50 });
  // Control points share the y of their own end.
  assert.equal(d, "M0 0 C100 0 100 50 200 50");
});

test("a short thread still bends", () => {
  const d = threadPath({ x: 0, y: 0 }, { x: 10, y: 40 });
  assert.equal(d, "M0 0 C24 0 -14 40 10 40");
});

test("a thread to an answer on the left bends the other way", () => {
  const d = threadPath({ x: 200, y: 0 }, { x: 0, y: 0 });
  assert.equal(d, "M200 0 C100 0 100 0 0 0");
});

test("a wrapped passage is left from its furthest line", () => {
  const end = passageEnd([rect(300, 100, 120, 20), rect(40, 120, 90, 20)]);
  assert.deepEqual(end, { right: 420, middle: 110 });
});

test("empty line boxes are ignored", () => {
  assert.equal(passageEnd([rect(0, 0, 0, 20)]), null);
  assert.equal(passageEnd([]), null);
});
