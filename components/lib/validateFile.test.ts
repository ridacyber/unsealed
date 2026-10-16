// owner: m
// Run with: npx tsx --test components/lib/validateFile.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_FILE_SIZE_MB, validateFile } from "./validateFile";

const MB = 1024 * 1024;

function pdfOf(bytes: number, name = "letter.pdf", type = "application/pdf") {
  return new File([new Uint8Array(bytes)], name, { type });
}

test("the limit stays under the hosting's 4.5 MB request body limit", () => {
  assert.ok(MAX_FILE_SIZE_MB <= 4);
});

test("a PDF exactly at the limit is accepted", () => {
  assert.deepEqual(validateFile(pdfOf(MAX_FILE_SIZE_MB * MB)), { ok: true });
});

test("a PDF one byte over the limit is rejected, naming the limit", () => {
  const result = validateFile(pdfOf(MAX_FILE_SIZE_MB * MB + 1));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.problem, "too_large");
  assert.match(result.message, new RegExp(`${MAX_FILE_SIZE_MB} MB`));
});

test("an empty PDF is rejected as empty, not as too large", () => {
  const result = validateFile(pdfOf(0));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.problem, "empty");
});

test("a file that is not a PDF is rejected whatever its size", () => {
  const result = validateFile(pdfOf(10, "letter.txt", "text/plain"));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.problem, "unsupported_type");
});

test("a PDF with no reported type is accepted by its extension", () => {
  assert.deepEqual(validateFile(pdfOf(10, "letter.PDF", "")), { ok: true });
});
