// owner: m
// Run with: npx tsx --test app/results/fixtures.test.tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HighlightedText } from "@/components/document/HighlightedText";
import { passageInContext, type LetterMark } from "@/components/document/letterMarks";
import { resolveCitation, verifiedConflicts } from "@/components/lib/citation";
import { displayStatus } from "@/components/lib/fields";
import { SAMPLE_LETTERS } from "@/components/lib/samples";
import { FieldCard } from "@/components/results/FieldCard";
import { ResultsView } from "@/components/results/ResultsView";
import { AnalysisResultSchema, FIELD_NAMES, type AnalysisResult } from "@/lib/schema";
import { FIXTURES, getFixture, isFixtureId } from "./fixtures";

const NOTICE =
  "Additional consistency check unavailable. Your letter was analyzed, but we couldn’t complete the additional check for conflicting information. Please review important details carefully.";

const plain = (markup: string) =>
  markup
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const textOf = (result: AnalysisResult) =>
  plain(renderToStaticMarkup(<ResultsView result={result} letterName="letter.pdf" onStartOver={() => {}} />));

const count = (text: string, part: string) => text.split(part).length - 1;

test("every fixture matches the service's response contract", () => {
  for (const { id, result } of FIXTURES) {
    const parsed = AnalysisResultSchema.safeParse(result);
    assert.ok(parsed.success, `${id}: ${parsed.success ? "" : parsed.error.message}`);
  }
});

test("fixtures stay out of the public samples, and their ids are checked", () => {
  assert.deepEqual(
    SAMPLE_LETTERS.map(({ id }) => id),
    ["partial", "not-found", "conflict"],
  );
  assert.equal(isFixtureId("long"), true);
  assert.equal(isFixtureId("partial"), false);
  assert.equal(isFixtureId(["long"]), false);
  assert.equal(isFixtureId(undefined), false);
});

test("fixture passages resolve, except the ones built to fail", () => {
  const meantToFail = new Set([
    "unmatched/amountOwed",
    "unmatched/requiredAction",
    "no-text/amountOwed",
    "no-text/deadline",
  ]);
  for (const { id, result } of FIXTURES) {
    for (const name of FIELD_NAMES) {
      const { citation } = result.fields[name];
      if (!citation) continue;
      const resolved = resolveCitation(result.documentText, citation);
      if (meantToFail.has(`${id}/${name}`)) assert.equal(resolved, null, `${id}/${name}`);
      else assert.ok(resolved, `${id}/${name}`);
    }
  }
});

test("only conflicts with both passages confirmed are shown", () => {
  const counts = Object.fromEntries(FIXTURES.map(({ id, result }) => [id, verifiedConflicts(result).length]));
  assert.deepEqual(counts, {
    "all-verified": 0,
    mixed: 0,
    "related-unsure": 1,
    "multi-conflict": 2,
    "check-failed": 0,
    "none-confirmed": 0,
    unmatched: 0,
    "no-text": 0,
    long: 1,
    "money-to-you": 0,
  });
});

test("two conflicts are numbered, and the unconfirmable one is left out whole", () => {
  const text = textOf(getFixture("multi-conflict").result);
  assert.equal(count(text, "Possible conflict 1 of 2"), 1);
  assert.equal(count(text, "Possible conflict 2 of 2"), 1);
  assert.equal(count(text, "of 3"), 0);
  assert.equal(count(text, "can't be confirmed"), 0);
  assert.equal(count(text, "Show passage 1 in your letter"), 2);
  assert.equal(count(text, "Show passage 2 in your letter"), 2);
  // A single conflict isn't counted.
  assert.equal(count(textOf(getFixture("related-unsure").result), "Possible conflict 1 of"), 0);
});

test("each fixture gets the overview its state calls for", () => {
  const expected: Record<string, string> = {
    "all-verified": "All 4 details are stated in your letter.",
    mixed: "2 of 4 details couldn’t be confirmed.",
    "related-unsure": "2 of 4 details couldn’t be confirmed.",
    "multi-conflict": "3 of 4 details couldn’t be confirmed.",
    "check-failed": "Supporting passages are available for all four details.",
    "none-confirmed": "Unsealed couldn’t confirm the details of this letter.",
    unmatched: "2 of 4 details couldn’t be confirmed.",
    "no-text": "2 of 4 details couldn’t be confirmed.",
    long: "Each detail below is quoted from your letter, but the letter may disagree with itself.",
    "money-to-you": "1 of 4 details couldn’t be confirmed.",
  };
  for (const { id, result } of FIXTURES) {
    assert.equal(count(textOf(result), expected[id]), 1, id);
  }
});

test("the check-unavailable notice appears for a failed check and nowhere else", () => {
  for (const { id, result } of FIXTURES) {
    const text = textOf(result);
    assert.equal(count(text, NOTICE), id === "check-failed" ? 1 : 0, id);
    if (id === "check-failed") {
      assert.ok(text.indexOf(NOTICE) < text.indexOf("Supporting passages are available"));
      assert.equal(count(text, "All 4 details are stated"), 0);
    }
  }
});

test("an unsure answer's value is never shown on its card", () => {
  let checked = 0;
  for (const { id, result } of FIXTURES) {
    for (const name of FIELD_NAMES) {
      const field = result.fields[name];
      if (displayStatus(field) !== "unsure" || !field.value) continue;
      for (const isOpen of [false, true]) {
        // The letter's own words may contain the figure, and stand in for
        // the answer when opened; the card itself must never state it.
        const card = plain(
          renderToStaticMarkup(
            <FieldCard name={name} field={field} isOpen={isOpen} located={false} onToggle={() => {}} />,
          ).replace(/<blockquote[\s\S]*?<\/blockquote>/g, ""),
        );
        assert.equal(count(card, field.value), 0, `${id}/${name}`);
        assert.equal(count(card, "We couldn't confirm this"), 1, `${id}/${name}`);
      }
      checked++;
    }
  }
  assert.ok(checked >= 6, `checked ${checked}`);
});

test("a quote that can't be placed is offered as unmatched, never as the letter's", () => {
  const text = textOf(getFixture("unmatched").result);
  assert.equal(count(text, "Show the unmatched quote"), 2);
  const { amountOwed } = getFixture("unmatched").result.fields;
  const open = plain(
    renderToStaticMarkup(
      <FieldCard name="amountOwed" field={amountOwed} isOpen located={false} onToggle={() => {}} />,
    ),
  );
  assert.equal(count(open, "Not matched to your letter's text"), 1);
  assert.equal(count(open, "From your letter"), 0);
  assert.equal(count(open, "See it in your letter"), 0);
});

test("a located passage is shown in the letter's own words, in context", () => {
  const { result } = getFixture("all-verified");
  const field = result.fields.deadline;
  const range = resolveCitation(result.documentText, field.citation!);
  assert.ok(range);
  const markup = renderToStaticMarkup(
    <FieldCard
      name="deadline"
      field={field}
      isOpen
      located
      context={passageInContext(result.documentText, range)}
      onToggle={() => {}}
    />,
  );
  assert.match(markup, /data-evidence-source=""/);
  assert.match(markup, /<mark class="rw-mark" data-tone="active">Payment is due by November 3, 2026<\/mark>/);
  assert.equal(count(plain(markup), "From your letter"), 1);
});

test("a closed card, or an unlocated one, is not a thread's starting point", () => {
  const { result } = getFixture("unmatched");
  for (const [isOpen, located] of [[false, true], [true, false], [false, false]] as const) {
    const markup = renderToStaticMarkup(
      <FieldCard name="amountOwed" field={result.fields.amountOwed} isOpen={isOpen} located={located} onToggle={() => {}} />,
    );
    assert.doesNotMatch(markup, /data-evidence-source/);
  }
});

test("with no letter text, the page says so and marks nothing", () => {
  const markup = renderToStaticMarkup(
    <ResultsView result={getFixture("no-text").result} letterName="letter.pdf" onStartOver={() => {}} />,
  );
  assert.equal(count(plain(markup), "The text of this letter isn’t available."), 1);
  assert.doesNotMatch(markup, /<mark/);
  assert.doesNotMatch(markup, /data-letter-sheet/);
});

test("money owed to the reader isn't shown as an amount, and the page adds no 'owe' of its own", () => {
  const { result } = getFixture("money-to-you");
  const card = plain(
    renderToStaticMarkup(
      <FieldCard name="amountOwed" field={result.fields.amountOwed} isOpen={false} located={false} onToggle={() => {}} />,
    ),
  );
  assert.equal(count(card, "$640.00"), 0);
  assert.equal(count(card, "The letter doesn't say"), 1);

  let text = textOf(result);
  for (const fromService of [result.summary, ...FIELD_NAMES.map((n) => result.fields[n].note ?? "")]) {
    if (fromService) text = text.split(plain(fromService).trim()).join(" ");
  }
  assert.doesNotMatch(text, /\bowe(s|d)?\b/i);
});

test("the letter's text survives marking exactly, overlapping marks included", () => {
  const { result } = getFixture("long");
  const marks: LetterMark[] = FIELD_NAMES.map((name, index) => ({
    range: resolveCitation(result.documentText, result.fields[name].citation!)!,
    tone: index === 0 ? "active" : "resting",
    status: "verified",
  }));
  marks.push({ range: { start: 0, end: 60 }, tone: "related", tag: "1" });
  const markup = renderToStaticMarkup(<HighlightedText text={result.documentText} marks={marks} />);
  const shown = markup
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
  assert.equal(shown, result.documentText);
  assert.equal(count(markup, 'data-tag="1"'), 1);
  assert.match(markup, /data-testid="letter-highlight"/);
});

test("before anything is chosen, the letter underlines only confirmed passages", () => {
  const markup = renderToStaticMarkup(
    <ResultsView result={getFixture("unmatched").result} letterName="letter.pdf" onStartOver={() => {}} />,
  );
  const resting = markup.match(/<mark[^>]*data-tone="resting"[^>]*>([^<]*)<\/mark>/g) ?? [];
  // Only the deadline is placed; the shifted amount and the -1 action are not.
  assert.equal(resting.length, 1);
  assert.match(resting[0], /by October 31, 2026/);
  assert.doesNotMatch(markup, /data-mark-active/);
});

test("a conflict's number is held to its passage's first character, and the text is unchanged", () => {
  const { result } = getFixture("related-unsure");
  const [conflict] = verifiedConflicts(result);
  const marks: LetterMark[] = conflict.passages.map((passage, side) => ({
    range: passage.range,
    tone: side === 1 ? "active" : "related",
    tag: String(side + 1),
  }));
  const markup = renderToStaticMarkup(<HighlightedText text={result.documentText} marks={marks} />);
  // The case that wrapped: passage 2 starts after "your " near a line's end.
  assert.match(markup, /<span class="rw-mark-lead" data-tag="2">r<\/span>emaining balance/);
  assert.match(markup, /<span class="rw-mark-lead" data-tag="1">A<\/span>mount due: \$312\.40/);
  assert.equal(count(markup, "data-tag="), 2);
  assert.doesNotMatch(markup, /<mark[^>]*data-tag/);
  // The highlight still covers exactly the confirmed passage.
  const active = markup.match(/<mark[^>]*data-tone="active"[^>]*>([\s\S]*?)<\/mark>/);
  assert.ok(active);
  assert.equal(active[1].replace(/<[^>]+>/g, ""), conflict.passages[1].quote);
  assert.equal(markup.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&"), result.documentText);
});

test("a tagged passage that starts with a line break keeps it", () => {
  const text = "Total\nDue now";
  const markup = renderToStaticMarkup(
    <HighlightedText text={text} marks={[{ range: { start: 5, end: 13 }, tone: "related", tag: "1" }]} />,
  );
  assert.match(markup, /<span class="rw-mark-lead" data-tag="1"><\/span>\nDue now/);
  assert.equal(markup.replace(/<[^>]+>/g, ""), text);
});

test("several conflicts offer a jump to the answers, after the summary and before the warnings", () => {
  const { result } = getFixture("multi-conflict");
  const markup = renderToStaticMarkup(<ResultsView result={result} letterName="letter.pdf" onStartOver={() => {}} />);
  assert.match(markup, /<p class="lg:hidden"><a href="#the-four-answers"[^>]*>Jump to the four answers/);
  assert.equal(count(markup, 'id="the-four-answers"'), 1);
  assert.match(markup, /<p id="the-four-answers" tabindex="-1"[^>]*>.*?The four answers<\/p>/);

  const text = plain(markup);
  const order = [
    result.summary,
    "Jump to the four answers",
    "Possible conflicting information",
    "Possible conflict 2 of 2",
    "3 of 4 details couldn’t be confirmed.",
    "The four answers",
  ].map((part) => text.indexOf(part));
  assert.ok(order.every((at) => at >= 0), String(order));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  // Nothing is hidden or taken away: both passages of both conflicts remain.
  assert.equal(count(text, "Show passage 1 in your letter"), 2);
  assert.equal(count(text, "Show passage 2 in your letter"), 2);
});

test("one conflict or none: no jump link", () => {
  for (const id of ["related-unsure", "long", "all-verified", "check-failed"] as const) {
    const markup = renderToStaticMarkup(
      <ResultsView result={getFixture(id).result} letterName="letter.pdf" onStartOver={() => {}} />,
    );
    assert.equal(count(markup, "Jump to the four answers"), 0, id);
    assert.equal(count(markup, 'href="#the-four-answers"'), 0, id);
  }
});
