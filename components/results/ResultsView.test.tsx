// owner: m
// Run with: npx tsx --test components/results/ResultsView.test.tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { mockResult } from "@/lib/mock";
import type { AnalysisResult } from "@/lib/schema";
import { getSample, SAMPLE_LETTERS } from "@/components/lib/samples";
import { ResultsView } from "./ResultsView";

const NOTICE =
  "Additional consistency check unavailable. Your letter was analyzed, but we couldn’t complete the additional check for conflicting information. Please review important details carefully.";
const ALL_STATED = "details are stated in your letter.";
const HELD_BACK =
  "Supporting passages are available for all four details. Review them carefully against your letter before acting.";

/** The words on the page, without the markup around them. */
function textOf(result: AnalysisResult): string {
  return renderToStaticMarkup(
    <ResultsView result={result} letterName="letter.pdf" onStartOver={() => {}} />,
  )
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

const count = (text: string, part: string) => text.split(part).length - 1;

const withCheck = (
  result: AnalysisResult,
  checkStatus?: "ok" | "failed",
): AnalysisResult => ({
  ...result,
  metrics: { ...result.metrics, checkStatus },
});

const allVerified: AnalysisResult = {
  ...mockResult,
  fields: {
    ...mockResult.fields,
    requiredAction: {
      ...mockResult.fields.requiredAction,
      status: "verified",
      confidence: 0.95,
      note: null,
    },
  },
  overall: "ok",
};

test("a failed check is said once, above the overview", () => {
  const text = textOf(withCheck(mockResult, "failed"));
  assert.equal(count(text, NOTICE), 1);
  assert.ok(text.indexOf(NOTICE) < text.indexOf("details couldn’t be confirmed."));
});

test("a check that ran, or isn't reported on, shows no notice", () => {
  assert.equal(count(textOf(withCheck(mockResult, "ok")), NOTICE), 0);
  assert.equal(count(textOf(mockResult), NOTICE), 0);
});

test("the prepared samples show no notice", () => {
  for (const { id, result } of SAMPLE_LETTERS) {
    assert.equal(count(textOf(result), NOTICE), 0, id);
  }
});

test("the amount-left-out sample shows the gap, and no amount owed anywhere", () => {
  const text = textOf(getSample("not-found").result);
  // Not in the letter beside the answers, the summary or the answers.
  assert.equal(count(text, "1,250"), 0);
  const howMuch = text.slice(text.indexOf("How much?"), text.indexOf("When?"));
  assert.ok(howMuch.includes("Not found"), howMuch);
  assert.ok(text.includes("Your tuition balance is due by November 15, 2026"));
});

test("verified details are not a plain success when the check failed", () => {
  const text = textOf(withCheck(allVerified, "failed"));
  assert.equal(count(text, NOTICE), 1);
  assert.equal(count(text, ALL_STATED), 0);
  assert.equal(count(text, HELD_BACK), 1);
});

test("verified details are a plain success when the check ran or isn't reported on", () => {
  for (const result of [withCheck(allVerified, "ok"), allVerified]) {
    const text = textOf(result);
    assert.equal(count(text, ALL_STATED), 1);
    assert.equal(count(text, HELD_BACK), 0);
  }
});

test("a failed check leaves each detail's own label as it was", () => {
  const labels = (text: string) => text.slice(text.indexOf("How much?"));
  assert.equal(
    labels(textOf(withCheck(allVerified, "failed"))),
    labels(textOf(allVerified)),
  );
});
