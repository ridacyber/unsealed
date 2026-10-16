// owner: m
// Run with: npx tsx --test components/hooks/useAnalysis.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { getSample } from "@/components/lib/samples";
import {
  analysisReducer,
  screenFor,
  type AnalysisSource,
  type AnalysisState,
} from "./useAnalysis";

const upload: AnalysisSource = {
  kind: "upload",
  file: new File(["%PDF-1.4"], "made-up-letter.pdf", { type: "application/pdf" }),
};
const sample: AnalysisSource = { kind: "sample", id: "partial" };
const result = getSample("partial").result;

const idle: AnalysisState = { phase: "idle" };
const processing = (source: AnalysisSource): AnalysisState =>
  analysisReducer(idle, { type: "started", source });

test("starting an analysis waits on that source, with no stage yet", () => {
  assert.deepEqual(processing(upload), { phase: "processing", source: upload, stage: null });
});

test("a running analysis records stages and ends in results or a failure", () => {
  const running = analysisReducer(processing(upload), { type: "stage_changed", stage: "finding" });
  assert.deepEqual(running, { phase: "processing", source: upload, stage: "finding" });
  assert.deepEqual(analysisReducer(running, { type: "succeeded", result }), {
    phase: "done",
    source: upload,
    result,
  });
  assert.deepEqual(analysisReducer(running, { type: "failed", code: "timed_out" }), {
    phase: "failed",
    source: upload,
    code: "timed_out",
  });
});

test("an answer that arrives after a reset or a failure changes nothing", () => {
  for (const state of [
    idle,
    analysisReducer(processing(upload), { type: "failed", code: "upload_failed" }),
    analysisReducer(processing(upload), { type: "succeeded", result }),
  ]) {
    assert.equal(analysisReducer(state, { type: "succeeded", result }), state);
    assert.equal(analysisReducer(state, { type: "failed", code: "processing_failed" }), state);
    assert.equal(analysisReducer(state, { type: "stage_changed", stage: "reading" }), state);
  }
});

test("trying again starts the same source over; resetting goes back to the start", () => {
  const failed = analysisReducer(processing(upload), { type: "failed", code: "timed_out" });
  assert.equal(failed.phase, "failed");
  const retried = analysisReducer(failed, { type: "started", source: upload });
  assert.deepEqual(retried, { phase: "processing", source: upload, stage: null });
  // The very same file is sent again, not a copy or another file.
  assert.equal(retried.phase === "processing" && retried.source, upload);
  assert.deepEqual(analysisReducer(failed, { type: "reset" }), idle);
  assert.deepEqual(analysisReducer(processing(upload), { type: "reset" }), idle);
});

test("each state has its screen, and an uploaded letter is waited on in view", () => {
  assert.equal(screenFor(idle), "landing");
  assert.equal(screenFor(processing(upload)), "processing");
  assert.equal(screenFor(analysisReducer(processing(upload), { type: "succeeded", result })), "results");
  assert.equal(screenFor(analysisReducer(processing(upload), { type: "failed", code: "no_text" })), "error");
});

test("a prepared sample keeps the landing up while it opens, then shows its results", () => {
  const opening = processing(sample);
  // The state machine still passes through processing for a sample...
  assert.equal(opening.phase, "processing");
  // ...but no waiting screen is drawn for it.
  assert.equal(screenFor(opening), "landing");
  assert.equal(screenFor(analysisReducer(opening, { type: "succeeded", result })), "results");
});
