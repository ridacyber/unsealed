// owner: m
// Run with: npx tsx --test components/lib/samples.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { mockResult } from "@/lib/mock";
import { evidenceSummary, getSample, senderOf } from "./samples";

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
