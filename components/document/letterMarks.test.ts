// owner: m
// Run with: npx tsx --test components/document/letterMarks.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  passageInContext,
  segmentLetter,
  splitLead,
  strongest,
  type LetterMark,
} from "./letterMarks";

const TEXT = "Pay $84.20 by November 3, 2026, or a late fee applies.";
const join = (text: string, marks: LetterMark[]) =>
  segmentLetter(text, marks)
    .map((segment) => segment.text)
    .join("");

test("the segments always join back into the letter's text exactly", () => {
  const marks: LetterMark[] = [
    { range: { start: 4, end: 10 }, tone: "resting" },
    { range: { start: 0, end: 30 }, tone: "active" },
    { range: { start: 14, end: 30 }, tone: "related" },
  ];
  assert.equal(join(TEXT, marks), TEXT);
  assert.equal(join(TEXT, []), TEXT);
  assert.equal(join("", marks), "");
});

test("with no marks the letter is one plain segment", () => {
  const segments = segmentLetter(TEXT, []);
  assert.equal(segments.length, 1);
  assert.deepEqual(segments[0].marks, []);
});

test("a mark covers exactly its range", () => {
  const segments = segmentLetter(TEXT, [
    { range: { start: 4, end: 10 }, tone: "active" },
  ]);
  const marked = segments.filter((segment) => segment.marks.length > 0);
  assert.equal(marked.length, 1);
  assert.equal(marked[0].text, "$84.20");
});

test("overlapping marks are split, and each part keeps every mark over it", () => {
  const outer: LetterMark = { range: { start: 0, end: 30 }, tone: "resting" };
  const inner: LetterMark = { range: { start: 4, end: 10 }, tone: "active" };
  const segments = segmentLetter(TEXT, [outer, inner]);
  const amount = segments.find((segment) => segment.text === "$84.20");
  assert.ok(amount);
  assert.equal(amount.marks.length, 2);
  assert.equal(strongest(amount.marks)?.tone, "active");
  assert.equal(strongest(segments[0].marks)?.tone, "resting");
});

test("a range that doesn't fit the text is dropped, never moved", () => {
  const bad: LetterMark[] = [
    { range: { start: -1, end: -1 }, tone: "active" },
    { range: { start: 10, end: 4 }, tone: "active" },
    { range: { start: 40, end: 999 }, tone: "active" },
    { range: { start: 2.5, end: 6 }, tone: "active" },
  ];
  const segments = segmentLetter(TEXT, bad);
  assert.equal(segments.length, 1);
  assert.deepEqual(segments[0].marks, []);
});

test("active outranks related, which outranks resting", () => {
  const range = { start: 0, end: 3 };
  assert.equal(
    strongest([
      { range, tone: "resting" },
      { range, tone: "related" },
    ])?.tone,
    "related",
  );
  assert.equal(
    strongest([
      { range, tone: "related" },
      { range, tone: "active" },
    ])?.tone,
    "active",
  );
  assert.equal(strongest([]), null);
});

test("a passage in context is the letter's own text around the range", () => {
  const context = passageInContext(TEXT, { start: 4, end: 10 }, 6);
  assert.ok(context);
  assert.equal(context.passage, "$84.20");
  assert.equal(
    context.before + context.passage + context.after,
    TEXT.slice(TEXT.indexOf(context.before), TEXT.indexOf(context.after) + context.after.length),
  );
  assert.equal(context.clippedBefore, false);
  assert.equal(context.clippedAfter, true);
});

test("context is cut at word boundaries", () => {
  const context = passageInContext(TEXT, { start: 14, end: 30 }, 8);
  assert.ok(context);
  assert.equal(context.passage, "November 3, 2026");
  assert.ok(!context.before.startsWith("20"), context.before);
  assert.ok(context.before === "" || TEXT.includes(context.before));
  assert.ok(!/\S$/.test(context.after) || TEXT.includes(context.after));
});

test("no context for a range that doesn't fit", () => {
  assert.equal(passageInContext(TEXT, { start: -1, end: -1 }), null);
  assert.equal(passageInContext(TEXT, { start: 5, end: 500 }), null);
  assert.equal(passageInContext("", { start: 0, end: 1 }), null);
});

test("a tag's lead is the passage's first character, and the parts rejoin exactly", () => {
  assert.deepEqual(splitLead("remaining balance"), ["r", "emaining balance"]);
  assert.deepEqual(splitLead("$321.40"), ["$", "321.40"]);
  assert.deepEqual(splitLead("x"), ["x", ""]);
  // A character outside the basic plane is kept whole.
  assert.deepEqual(splitLead("𝟐 items"), ["𝟐", " items"]);
  for (const text of ["remaining balance", "$321.40", "𝟐 items", "x"]) {
    assert.equal(splitLead(text).join(""), text);
  }
});

test("whitespace and empty text are never split off", () => {
  assert.deepEqual(splitLead("\nAmount due"), ["", "\nAmount due"]);
  assert.deepEqual(splitLead(" Amount"), ["", " Amount"]);
  assert.deepEqual(splitLead(""), ["", ""]);
});
