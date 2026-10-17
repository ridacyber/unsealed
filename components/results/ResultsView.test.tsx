// owner: m
// Run with: npx tsx --test components/results/ResultsView.test.tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { mockResult } from "@/lib/mock";
import type { AnalysisResult, Citation, Warning } from "@/lib/schema";
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
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** The markup itself, for what the words don't show: marks, buttons, tags. */
const markupOf = (result: AnalysisResult) =>
  renderToStaticMarkup(<ResultsView result={result} letterName="letter.pdf" onStartOver={() => {}} />);

/** The letter's underlined passages before anything is chosen. */
const restingMarks = (result: AnalysisResult) =>
  markupOf(result).match(/<mark[^>]*data-tone="resting"[^>]*>([^<]*)<\/mark>/g) ?? [];

const howMuchCard = (text: string) => text.slice(text.indexOf("How much?"), text.indexOf("When?"));

const UNCONFIRMED_ONE = "1 of 4 details couldn’t be confirmed.";

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

// --- An answer reported as verified is shown so only with its quote found.

const amount = allVerified.fields.amountOwed;
const amountCitation = amount.citation!;
const withAmountCitation = (citation: Citation | null): AnalysisResult => ({
  ...allVerified,
  fields: { ...allVerified.fields, amountOwed: { ...amount, citation } },
});

test("a verified answer with no quote is shown as unsure, and the page is no all-clear", () => {
  const text = textOf(withAmountCitation(null));
  const card = howMuchCard(text);
  assert.ok(card.includes("Unsure") && !card.includes("Verified"), card);
  assert.equal(count(card, "$1,250.00"), 0);
  assert.equal(count(card, "No quote from your letter came with this answer"), 1);
  assert.equal(count(text, UNCONFIRMED_ONE), 1);
  assert.equal(count(text, ALL_STATED), 0);
});

const unmatchedQuotes: Array<[why: string, citation: Citation]> = [
  ["its quote wasn't located", { ...amountCitation, start: -1, end: -1 }],
  ["its offsets point at other words", { ...amountCitation, start: amountCitation.start + 3, end: amountCitation.end + 3 }],
  ["its offsets run past the letter", { ...amountCitation, end: mockResult.documentText.length + 5 }],
  ["its quote isn't in the letter", { ...amountCitation, quote: "tuition balance of $9,999.00" }],
  ["its quote is empty", { ...amountCitation, quote: "  " }],
];

for (const [why, citation] of unmatchedQuotes) {
  test(`a verified answer is shown as unsure when ${why}`, () => {
    const result = withAmountCitation(citation);
    const text = textOf(result);
    const card = howMuchCard(text);
    assert.ok(card.includes("Unsure") && !card.includes("Verified"), card);
    assert.equal(count(card, "$1,250.00"), 0, "the unconfirmed value isn't stated");
    const hasQuote = citation.quote.trim() !== "";
    assert.equal(count(card, "couldn't match the quote behind this answer"), hasQuote ? 1 : 0);
    // The quote can still be read, as unmatched; never as the letter's.
    assert.equal(count(card, "Show the unmatched quote"), hasQuote ? 1 : 0);
    assert.equal(count(text, UNCONFIRMED_ONE), 1);
    assert.equal(count(text, ALL_STATED), 0);
    // Nothing of it is marked in the letter; the other three still are.
    const marks = restingMarks(result);
    assert.equal(marks.length, 3);
    assert.ok(marks.every((mark) => !mark.includes("1,250")));
  });
}

test("matched evidence stays verified, also when quoted with other spacing, case and punctuation", () => {
  const spaced = withAmountCitation({ ...amountCitation, quote: "TUITION   balance\nof $1,250.00" });
  // An en dash where the letter has a hyphen: only the quote is compared.
  const passage = "2026-27 financial aid award";
  const start = mockResult.documentText.indexOf(passage);
  const dashed = withAmountCitation({ quote: "2026–27 Financial aid award", start, end: start + passage.length });
  for (const result of [allVerified, spaced, dashed]) {
    const text = textOf(result);
    assert.ok(howMuchCard(text).includes("Verified"));
    assert.equal(count(text, ALL_STATED), 1);
    assert.equal(restingMarks(result).length, 4);
  }
});

test("an answer the letter doesn't give stays not found, whatever comes with it", () => {
  const sample = getSample("not-found").result;
  const strayQuote: AnalysisResult = {
    ...sample,
    fields: {
      ...sample.fields,
      amountOwed: { ...sample.fields.amountOwed, citation: { quote: "anything", start: -1, end: -1 } },
    },
  };
  for (const result of [sample, strayQuote]) {
    const card = howMuchCard(textOf(result));
    assert.ok(card.includes("Not found") && !card.includes("Unsure"), card);
  }
});

test("a failed check is still said once beside an answer held back for its quote", () => {
  const text = textOf(withCheck(withAmountCitation(null), "failed"));
  assert.equal(count(text, NOTICE), 1);
  assert.equal(count(text, UNCONFIRMED_ONE), 1);
  assert.equal(count(text, ALL_STATED), 0);
});

// --- A reported conflict stays on the page even when its passages can't be shown.

const deadlineCitation = allVerified.fields.deadline.citation!;
const reported = (quotes: [Citation, Citation], message = "The letter gives two different due dates."): Warning => ({
  kind: "conflict",
  message,
  quotes,
});
const UNLOCATED: Citation = { quote: "due by December 1, 2026", start: -1, end: -1 };

test("a reported conflict with an unmatched quote stays, unmarked, and holds back the all-clear", () => {
  const result: AnalysisResult = { ...allVerified, warnings: [reported([deadlineCitation, UNLOCATED])] };
  const text = textOf(result);
  const markup = markupOf(result);
  assert.equal(count(text, "Possible conflicting information"), 1);
  assert.equal(count(text, "The letter gives two different due dates."), 1);
  assert.equal(count(text, "couldn’t confirm the passages it quoted"), 1);
  assert.equal(count(text, "found two passages in your letter"), 0);
  assert.equal(count(text, "Found in your letter"), 1);
  assert.equal(count(text, "Not matched to your letter's text"), 1);
  assert.equal(count(text, "“due by December 1, 2026”"), 1);
  // Nothing to go to in the letter: no passage buttons, number tags or threads.
  assert.equal(count(text, "Show passage"), 0);
  assert.doesNotMatch(markup, /rw-passage-tag|data-evidence-source|data-tone="related"/);
  assert.equal(count(markup, "<button"), count(markupOf(allVerified), "<button"));
  assert.equal(restingMarks(result).length, 4);
  // A reported conflict is never an all-clear.
  assert.equal(count(text, ALL_STATED), 0);
  assert.equal(count(text, "the letter may disagree with itself."), 1);
});

test("a blank warning is never the unseen reason the all-clear is held back", () => {
  const consequenceCitation = allVerified.fields.consequence.citation!;
  const blankFound = reported([deadlineCitation, consequenceCitation], " ");
  const blankUnfound = reported([deadlineCitation, UNLOCATED], "");

  // Found passages or not, a blank warning adds nothing, and the all-clear stands.
  const alone = textOf({ ...allVerified, warnings: [blankFound, blankUnfound] });
  assert.equal(count(alone, "Possible conflicting information"), 0);
  assert.equal(count(alone, ALL_STATED), 1);
  assert.equal(count(alone, "the letter may disagree with itself."), 0);

  // Beside a warning that has something to say, only that one is shown, and
  // it is the visible reason the all-clear is held back.
  const beside = textOf({ ...allVerified, warnings: [blankFound, reported([deadlineCitation, UNLOCATED])] });
  assert.equal(count(beside, "What Unsealed noticed"), 1);
  assert.equal(count(beside, "The letter gives two different due dates."), 1);
  assert.equal(count(beside, ALL_STATED), 0);

  // Beside an answer held back for its quote, the Unsure card is the reason.
  const heldBack = textOf({ ...withAmountCitation(null), warnings: [blankFound] });
  assert.equal(count(heldBack, "Possible conflicting information"), 0);
  assert.equal(count(heldBack, UNCONFIRMED_ONE), 1);
  assert.ok(howMuchCard(heldBack).includes("Unsure"));
});

// --- The generated summary isn't shown beside an answer held back for its quote.

const SUMMARY_WITHHELD =
  "The summary isn’t shown, because some of the evidence behind the answers below couldn’t be confirmed in your letter.";

/** From the summary's heading to the answers: the summary, warnings and overview. */
const summaryArea = (text: string) =>
  text.slice(text.indexOf("What does this letter mean?"), text.indexOf("The four answers"));

test("an answer held back for its quote can't be stated through the summary", () => {
  const telling: AnalysisResult = { ...allVerified, summary: "You owe $1,250.00 by November 15, 2026." };
  for (const citation of [null, { ...amountCitation, start: -1, end: -1 }]) {
    const result: AnalysisResult = { ...telling, fields: { ...telling.fields, amountOwed: { ...amount, citation } } };
    const area = summaryArea(textOf(result));
    assert.equal(count(area, SUMMARY_WITHHELD), 1);
    assert.equal(count(area, "$1,250.00"), 0, area);
    // Not in the markup at all, so not in anything a screen reader is given.
    assert.equal(count(markupOf(result), "You owe $1,250.00"), 0);
  }
});

test("the summary is shown whenever no answer is held back for its quote", () => {
  const cases: Array<[label: string, result: AnalysisResult]> = [
    ["all verified", allVerified],
    ["unsure as the service reported it", mockResult],
    ["failed check", withCheck(allVerified, "failed")],
    ["unmatched conflict", { ...allVerified, warnings: [reported([deadlineCitation, UNLOCATED])] }],
    ...SAMPLE_LETTERS.map(({ id, result }): [string, AnalysisResult] => [`sample ${id}`, result]),
  ];
  for (const [label, result] of cases) {
    const area = summaryArea(textOf(result));
    assert.equal(count(area, result.summary), 1, label);
    assert.equal(count(area, SUMMARY_WITHHELD), 0, label);
  }
});

test("a reported conflict with nothing to say adds nothing to the page", () => {
  const result: AnalysisResult = { ...allVerified, warnings: [reported([deadlineCitation, UNLOCATED], "   ")] };
  const text = textOf(result);
  assert.equal(count(text, "Possible conflicting information"), 0);
  assert.equal(count(text, ALL_STATED), 1);
});
