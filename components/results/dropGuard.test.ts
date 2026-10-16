// owner: m
// Run with: npx tsx --test components/results/dropGuard.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { refuseFileDrag, type FileDragEvent } from "./dropGuard";

function drag(type: string, types: string[] | null) {
  const event = {
    type,
    prevented: false,
    preventDefault() {
      event.prevented = true;
    },
    dataTransfer: types ? { types, dropEffect: "copy" } : null,
  };
  return event satisfies FileDragEvent & { prevented: boolean };
}

test("a file held over the results is refused, so the browser can't open it", () => {
  for (const type of ["dragenter", "dragover", "drop"]) {
    const event = drag(type, ["Files"]);
    assert.equal(refuseFileDrag(event), true);
    assert.equal(event.prevented, true, type);
    assert.equal(event.dataTransfer?.dropEffect, "none", type);
  }
});

test("dragging text or a link is left alone", () => {
  for (const types of [["text/plain"], ["text/uri-list", "text/html"], []]) {
    const event = drag("dragover", types);
    assert.equal(refuseFileDrag(event), false);
    assert.equal(event.prevented, false);
    assert.equal(event.dataTransfer?.dropEffect, "copy");
  }
});

test("an event without a data transfer is left alone", () => {
  const event = drag("drop", null);
  assert.equal(refuseFileDrag(event), false);
  assert.equal(event.prevented, false);
});
