// owner: m
// Run with: npx tsx --test components/lib/citation.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { mockNotFound, mockResult } from "@/lib/mock";
import type { AnalysisResult, Citation, Warning } from "@/lib/schema";
import { unplacedConflicts, verifiedConflicts } from "./citation";
import { mockConflict, SAMPLE_LETTERS } from "./samples";

const TEXT =
  "Balance due: $1,827.00\n\nYou owe the College $1,872.00. Pay by October 30, 2026.";

const span = (quote: string): Citation => {
  const start = TEXT.indexOf(quote);
  return { quote, start, end: start + quote.length };
};

const FIRST = span("Balance due: $1,827.00");
const SECOND = span("You owe the College $1,872.00");

const conflict = (a: Citation, b: Citation, message = "Two amounts."): Warning => ({
  kind: "conflict",
  message,
  quotes: [a, b],
});

const withWarnings = (warnings?: Warning[]): AnalysisResult => ({
  ...mockResult,
  documentText: TEXT,
  warnings,
});

test("no warnings key and an empty list both give no conflicts", () => {
  assert.deepEqual(verifiedConflicts(withWarnings(undefined)), []);
  assert.deepEqual(verifiedConflicts(withWarnings([])), []);
});

test("a valid conflict keeps the service's offsets", () => {
  assert.deepEqual(verifiedConflicts(withWarnings([conflict(FIRST, SECOND)])), [
    {
      message: "Two amounts.",
      passages: [
        { quote: FIRST.quote, range: { start: FIRST.start, end: FIRST.end } },
        { quote: SECOND.quote, range: { start: SECOND.start, end: SECOND.end } },
      ],
    },
  ]);
});

test("passages are put in reading order", () => {
  const [found] = verifiedConflicts(withWarnings([conflict(SECOND, FIRST)]));
  assert.equal(found.passages[0].quote, FIRST.quote);
  assert.equal(found.passages[1].quote, SECOND.quote);
});

test("a quote that differs only in spacing or letter case is kept", () => {
  const loose = { ...FIRST, quote: "  balance   DUE: $1,827.00 " };
  const [found] = verifiedConflicts(withWarnings([conflict(loose, SECOND)]));
  assert.deepEqual(found.passages[0].range, {
    start: FIRST.start,
    end: FIRST.end,
  });
});

const dropped: Array<[why: string, warning: Warning]> = [
  ["a passage was not located", conflict({ ...FIRST, start: -1, end: -1 }, SECOND)],
  ["a passage ends past the text", conflict(FIRST, { ...SECOND, end: TEXT.length + 5 })],
  ["a passage has no length", conflict(FIRST, { ...SECOND, end: SECOND.start })],
  [
    "offsets point at other words",
    conflict(FIRST, { ...SECOND, start: SECOND.start + 4, end: SECOND.end + 4 }),
  ],
  ["a quote that is not in the letter", conflict(FIRST, { ...SECOND, quote: "You owe $9.00" })],
  ["the same passage twice", conflict(FIRST, FIRST)],
  ["passages that overlap", conflict(span("You owe the College"), span("the College $1,872.00"))],
  ["a blank message", conflict(FIRST, SECOND, "   ")],
  ["an empty quote", conflict({ ...FIRST, quote: "" }, SECOND)],
];

for (const [why, warning] of dropped) {
  test(`dropped whole: ${why}`, () => {
    assert.deepEqual(verifiedConflicts(withWarnings([warning])), []);
  });
}

test("of two conflicts, only the valid one survives", () => {
  const found = verifiedConflicts(
    withWarnings([
      conflict(FIRST, { ...SECOND, start: -1, end: -1 }, "Not located."),
      conflict(FIRST, SECOND, "Located."),
    ]),
  );
  assert.deepEqual(
    found.map(({ message }) => message),
    ["Located."],
  );
});

test("the samples: one conflict in the conflict sample, none in the others", () => {
  const found = verifiedConflicts(mockConflict);
  assert.equal(found.length, 1);
  for (const { quote, range } of found[0].passages) {
    assert.equal(mockConflict.documentText.slice(range.start, range.end), quote);
  }
  assert.deepEqual(verifiedConflicts(mockResult), []);
  assert.deepEqual(verifiedConflicts(mockNotFound), []);
});

test("a conflict that can be shown is not also kept as unplaced", () => {
  assert.deepEqual(unplacedConflicts(withWarnings([conflict(FIRST, SECOND)])), []);
  assert.deepEqual(unplacedConflicts(withWarnings(undefined)), []);
});

for (const [why, warning] of dropped) {
  test(`kept as reported though not shown: ${why}`, () => {
    const kept = unplacedConflicts(withWarnings([warning])).map(({ message }) => message);
    // Only a warning with nothing to say is left out entirely.
    assert.deepEqual(kept, why === "a blank message" ? [] : ["Two amounts."]);
  });
}

test("an unplaced report says which of its quotes are found in the letter", () => {
  const [report] = unplacedConflicts(withWarnings([conflict(FIRST, { ...SECOND, start: -1, end: -1 })]));
  assert.deepEqual(report.quotes, [
    { quote: FIRST.quote, located: true },
    { quote: SECOND.quote, located: false },
  ]);
  // An empty quote has nothing to show and is left out of the report.
  const [noQuote] = unplacedConflicts(withWarnings([conflict({ ...FIRST, quote: " " }, SECOND)]));
  assert.deepEqual(noQuote.quotes, [{ quote: SECOND.quote, located: true }]);
});

test("a shown and an unplaced conflict each keep to their own list", () => {
  const result = withWarnings([
    conflict(FIRST, { ...SECOND, start: -1, end: -1 }, "Not located."),
    conflict(FIRST, SECOND, "Located."),
  ]);
  assert.deepEqual(verifiedConflicts(result).map(({ message }) => message), ["Located."]);
  assert.deepEqual(unplacedConflicts(result).map(({ message }) => message), ["Not located."]);
});

test("the samples have no unplaced conflicts", () => {
  for (const { id, result } of SAMPLE_LETTERS) assert.deepEqual(unplacedConflicts(result), [], id);
});
