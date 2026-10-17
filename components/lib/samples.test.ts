// owner: m
// Run with: npx tsx --test components/lib/samples.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { mockNotFound, mockResult } from "@/lib/mock";
import { FIELD_NAMES } from "@/lib/schema";
import { resolveCitation } from "./citation";
import { statusIn } from "./fields";
import { analyzeSample, resultForFile } from "./mockClient";
import {
  evidenceSummary,
  getSample,
  mockAmountLeftOut,
  SAMPLE_LETTERS,
  senderOf,
} from "./samples";

test("each prepared sample is shown with the statuses it was prepared with", () => {
  for (const { id, result } of SAMPLE_LETTERS) {
    for (const name of FIELD_NAMES) {
      assert.equal(statusIn(result, name), result.fields[name].status, `${id}/${name}`);
    }
  }
});

test("the amount-left-out sample's letter really leaves the amount out", () => {
  const { result } = getSample("not-found");
  // The same notice, word for word, less its amount.
  assert.equal(result.documentText, mockResult.documentText.replace("of $1,250.00 ", ""));
  // The only sum left is the late fee, a consequence rather than an amount owed.
  assert.deepEqual(result.documentText.match(/\$[\d,.]+/g), ["$75"]);
  assert.ok(result.fields.consequence.citation?.quote.includes("$75 late fee"));
  assert.deepEqual(result.fields.amountOwed, mockNotFound.fields.amountOwed);
  assert.equal(result.fields.amountOwed.status, "not_found");
  assert.equal(result.fields.amountOwed.citation, null);
});

test("its other three answers are the notice's own, quoted from this letter", () => {
  const { result } = getSample("not-found");
  for (const name of ["deadline", "requiredAction", "consequence"] as const) {
    const field = result.fields[name];
    const original = mockResult.fields[name];
    assert.deepEqual({ ...field, citation: null }, { ...original, citation: null }, name);
    assert.ok(field.citation, name);
    assert.equal(field.citation.quote, original.citation?.quote, name);
    const range = resolveCitation(result.documentText, field.citation);
    assert.ok(range, `${name} is found in the letter`);
    assert.equal(result.documentText.slice(range.start, range.end), field.citation.quote, name);
  }
  assert.equal(result.summary, mockResult.summary);
  assert.equal(result.documentType, mockResult.documentType);
  assert.equal(result.overall, mockResult.overall);
});

test("the partial sample is still the shared notice", () => {
  assert.equal(getSample("partial").result, mockResult);
});

test("every sample opens with its prepared answers and no request", async () => {
  const realFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = (async () => {
    requests += 1;
    throw new Error("a sample must not make a request");
  }) as typeof fetch;
  try {
    for (const sample of SAMPLE_LETTERS) {
      assert.equal(await analyzeSample(sample.id, {}, 0), sample.result, sample.id);
    }
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(requests, 0);
});

test("a demo-build upload named for a missing amount gets the same sample", () => {
  assert.equal(resultForFile("my-letter-missing.pdf"), mockAmountLeftOut);
  assert.equal(resultForFile("letter.pdf"), mockResult);
});

test("each sample's summary is read from its prepared result", () => {
  assert.deepEqual(evidenceSummary(getSample("partial").result), ["3 verified", "1 unsure"]);
  assert.deepEqual(evidenceSummary(getSample("not-found").result), [
    "2 verified",
    "1 unsure",
    "1 not found",
  ]);
  assert.deepEqual(evidenceSummary(getSample("conflict").result), [
    "3 verified",
    "1 unsure",
    "two passages disagree",
  ]);
});

test("a verified answer without a value is counted as unsure, as it is shown", () => {
  const result = {
    ...mockResult,
    fields: {
      ...mockResult.fields,
      deadline: { ...mockResult.fields.deadline, value: "  " },
    },
  };
  assert.deepEqual(evidenceSummary(result), ["2 verified", "2 unsure"]);
});

test("the sender is the letter's first line", () => {
  assert.equal(senderOf(getSample("partial").result), "HARTWELL STATE UNIVERSITY");
  assert.equal(senderOf(getSample("conflict").result), "NORTHFIELD COMMUNITY COLLEGE");
  assert.equal(senderOf({ ...mockResult, documentText: "\n\n  ACME  \nx" }), "ACME");
  assert.equal(senderOf({ ...mockResult, documentText: "" }), "");
});
