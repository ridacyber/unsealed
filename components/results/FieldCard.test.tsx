// owner: m
// Run with: npx tsx --test components/results/FieldCard.test.tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { passageInContext } from "@/components/document/letterMarks";
import { resolveCitation } from "@/components/lib/citation";
import { evidenceSummary, SAMPLE_LETTERS } from "@/components/lib/samples";
import { mockResult } from "@/lib/mock";
import {
  FIELD_NAMES,
  type AnalysisResult,
  type Citation,
  type Field,
  type FieldName,
} from "@/lib/schema";
import { FieldCard } from "./FieldCard";
import { ResultsView } from "./ResultsView";

/** What a missing answer says when the service's note adds nothing, word for word. */
const FALLBACK: Record<FieldName, string> = {
  amountOwed:
    "Unsealed couldn't identify an amount you're asked to pay in this letter, so it leaves this answer blank rather than guessing.",
  deadline:
    "Unsealed couldn't identify a date you need to act by in this letter, so it leaves this answer blank rather than guessing.",
  requiredAction:
    "Unsealed couldn't identify anything you're asked to do in this letter, so it leaves this answer blank rather than guessing.",
  consequence:
    "Unsealed couldn't identify what happens if you don't act in this letter, so it leaves this answer blank rather than guessing.",
};

const EVIDENCE_BUTTONS = ["Where the letter says this", "What the letter says", "Show the unmatched quote"];

const plain = (markup: string) =>
  markup
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const count = (text: string, part: string) => text.split(part).length - 1;

const missing = (note: string | null, citation: Citation | null = null): Field => ({
  status: "not_found",
  value: null,
  normalized: null,
  citation,
  confidence: 0,
  note,
});

const cardMarkup = (
  name: FieldName,
  field: Field,
  options: { isOpen?: boolean; located?: boolean; withContext?: boolean } = {},
) => {
  const range = field.citation ? resolveCitation(mockResult.documentText, field.citation) : null;
  return renderToStaticMarkup(
    <FieldCard
      name={name}
      field={field}
      isOpen={options.isOpen ?? false}
      located={options.located ?? false}
      context={options.withContext && range ? passageInContext(mockResult.documentText, range) : null}
      onToggle={() => {}}
    />,
  );
};

const pageMarkup = (result: AnalysisResult) =>
  renderToStaticMarkup(<ResultsView result={result} letterName="letter.pdf" onStartOver={() => {}} />);

/** The letter's underlined passages before anything is chosen. */
const restingMarks = (markup: string) =>
  markup.match(/<mark[^>]*data-tone="resting"[^>]*>([^<]*)<\/mark>/g) ?? [];

/** Each answer card's markup, by field. */
function cardsIn(markup: string): Record<FieldName, string> {
  const cards = {} as Record<FieldName, string>;
  for (const match of markup.matchAll(/<article[^>]*data-field="(\w+)"[^>]*>[\s\S]*?<\/article>/g)) {
    cards[match[1] as FieldName] = match[0];
  }
  return cards;
}

/** The answer cards' evidence buttons; a conflict's passage buttons aren't counted. */
const evidenceButtonsIn = (markup: string) =>
  Object.values(cardsIn(markup)).reduce((sum, card) => sum + count(card, "rw-evidence-toggle"), 0);

// --- What a missing answer says.

test("each missing answer says what Unsealed couldn't identify, when the service's note adds nothing", () => {
  const notesThatAddNothing = [null, "", "   ", "The letter doesn't say.", "the letter doesn’t say"];
  for (const name of FIELD_NAMES) {
    for (const note of notesThatAddNothing) {
      const text = plain(cardMarkup(name, missing(note)));
      const label = `${name} with note ${JSON.stringify(note)}`;
      assert.equal(count(text, "Not found"), 1, label);
      assert.equal(count(text, "The letter doesn't say"), 1, label);
      assert.equal(count(text, FALLBACK[name]), 1, label);
      // Only its own field's fallback, and never the old generic wording.
      for (const other of FIELD_NAMES) {
        if (other !== name) assert.equal(count(text, FALLBACK[other]), 0, label);
      }
      assert.equal(count(text, "found nothing about"), 0, label);
      // Copy of the page's own never tells the reader they owe anything.
      assert.doesNotMatch(text, /\bowe(s|d)?\b/i, label);
    }
  }
});

test("a missing answer keeps the service's own note when it says more", () => {
  const note = "The letter is about money owed to you, not an amount you need to pay.";
  for (const name of FIELD_NAMES) {
    const text = plain(cardMarkup(name, missing(note)));
    assert.equal(count(text, note), 1, name);
    assert.equal(count(text, FALLBACK[name]), 0, name);
    assert.equal(count(text, "The letter doesn't say"), 1, name);
  }
});

// --- A missing answer is never backed by a quote, whatever came with it.

const amountCitation = mockResult.fields.amountOwed.citation!;
const strayCitations: Array<[why: string, citation: Citation]> = [
  ["a citation the letter really holds", amountCitation],
  ["a citation that isn't located", { ...amountCitation, start: -1, end: -1 }],
  ["a quote that isn't in the letter", { quote: "tuition balance of $9,999.00", start: -1, end: -1 }],
];

for (const [why, citation] of strayCitations) {
  test(`a missing answer shows no quote, evidence or value when it comes with ${why}`, () => {
    const field: Field = { ...missing(null, citation), value: "$1,250.00", normalized: "1250.00" };
    const located = resolveCitation(mockResult.documentText, citation) !== null;
    // Even told it is open, with its passage in hand, the card points to nothing.
    for (const isOpen of [false, true]) {
      const markup = cardMarkup("amountOwed", field, { isOpen, located, withContext: true });
      const text = plain(markup);
      const label = `${why}, open: ${isOpen}`;
      assert.equal(count(text, FALLBACK.amountOwed), 1, label);
      assert.equal(count(text, "1,250"), 0, label);
      assert.equal(count(text, "9,999"), 0, label);
      assert.equal(count(text, citation.quote), 0, label);
      for (const button of EVIDENCE_BUTTONS) assert.equal(count(text, button), 0, label);
      assert.doesNotMatch(markup, /<button|<blockquote|<mark|rw-card-pin|data-evidence-source|data-clickable/, label);
    }
  });
}

test("on the page, a missing answer's stray citation is neither marked in the letter nor offered as evidence", () => {
  const result: AnalysisResult = {
    ...mockResult,
    fields: {
      ...mockResult.fields,
      amountOwed: { ...missing(null, amountCitation), value: "$1,250.00" },
    },
  };
  const markup = pageMarkup(result);
  const cards = cardsIn(markup);
  const amountCard = plain(cards.amountOwed);
  assert.match(cards.amountOwed, /data-status="not_found"/);
  assert.equal(count(amountCard, FALLBACK.amountOwed), 1);
  assert.equal(count(amountCard, "1,250"), 0);
  for (const button of EVIDENCE_BUTTONS) assert.equal(count(amountCard, button), 0);

  // The other three keep their evidence and their marks; the amount has neither.
  assert.equal(evidenceButtonsIn(markup), 3);
  const marks = restingMarks(markup);
  assert.equal(marks.length, 3);
  assert.ok(marks.every((mark) => !mark.includes("1,250")), marks.join("\n"));
  assert.doesNotMatch(markup, /data-evidence-source|data-tone="active"/);
  // Counted as it is shown: not found, not promoted by the citation.
  assert.deepEqual(evidenceSummary(result), ["2 verified", "1 unsure", "1 not found"]);
});

test("verified and unsure answers keep their evidence beside a missing one", () => {
  const result: AnalysisResult = {
    ...mockResult,
    fields: { ...mockResult.fields, deadline: missing(null, mockResult.fields.deadline.citation) },
  };
  const cards = cardsIn(pageMarkup(result));
  for (const name of FIELD_NAMES) {
    const shown = mockResult.fields[name].status;
    if (name === "deadline") {
      assert.match(cards[name], /data-status="not_found"/);
      assert.equal(count(plain(cards[name]), FALLBACK.deadline), 1);
      assert.doesNotMatch(cards[name], /rw-evidence-toggle/);
      continue;
    }
    assert.match(cards[name], new RegExp(`data-status="${shown}"`), name);
    assert.equal(
      count(plain(cards[name]), shown === "verified" ? "Where the letter says this" : "What the letter says"),
      1,
      name,
    );
  }
});

// --- The three prepared samples.

const SAMPLE_EXPECTATIONS: Record<
  string,
  { statuses: Record<FieldName, Field["status"]>; evidenceButtons: number; marks: number; conflict: boolean }
> = {
  partial: {
    statuses: { amountOwed: "verified", deadline: "verified", requiredAction: "unsure", consequence: "verified" },
    evidenceButtons: 4,
    marks: 4,
    conflict: false,
  },
  "not-found": {
    statuses: { amountOwed: "not_found", deadline: "verified", requiredAction: "unsure", consequence: "verified" },
    evidenceButtons: 3,
    marks: 3,
    conflict: false,
  },
  conflict: {
    statuses: { amountOwed: "unsure", deadline: "verified", requiredAction: "verified", consequence: "verified" },
    evidenceButtons: 4,
    marks: 4,
    conflict: true,
  },
};

test("the three samples keep their cards, evidence and warnings, with the fallback only where an answer is missing", () => {
  assert.deepEqual(SAMPLE_LETTERS.map(({ id }) => id).sort(), Object.keys(SAMPLE_EXPECTATIONS).sort());
  for (const { id, result } of SAMPLE_LETTERS) {
    const expected = SAMPLE_EXPECTATIONS[id];
    const markup = pageMarkup(result);
    const text = plain(markup);
    const cards = cardsIn(markup);
    for (const name of FIELD_NAMES) {
      const status = expected.statuses[name];
      assert.match(cards[name], new RegExp(`data-status="${status}"`), `${id}/${name}`);
      assert.equal(count(plain(cards[name]), FALLBACK[name]), status === "not_found" ? 1 : 0, `${id}/${name}`);
    }
    assert.equal(evidenceButtonsIn(markup), expected.evidenceButtons, id);
    assert.equal(restingMarks(markup).length, expected.marks, id);
    assert.equal(count(text, "Possible conflicting information"), expected.conflict ? 1 : 0, id);
    assert.equal(count(text, "Show passage 1 in your letter"), expected.conflict ? 1 : 0, id);
    assert.equal(count(text, "Show passage 2 in your letter"), expected.conflict ? 1 : 0, id);
    assert.equal(count(text, "found nothing about"), 0, id);
  }
});

test("the amount-left-out sample says why the amount is blank, and points to nothing for it", () => {
  const { result } = SAMPLE_LETTERS.find(({ id }) => id === "not-found")!;
  const card = cardsIn(pageMarkup(result)).amountOwed;
  const text = plain(card);
  assert.equal(count(text, "The letter doesn't say"), 1);
  assert.equal(count(text, FALLBACK.amountOwed), 1);
  assert.doesNotMatch(card, /<button|<blockquote|<mark|data-clickable/);
  assert.doesNotMatch(text, /\$/);
});
