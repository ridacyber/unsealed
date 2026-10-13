// owner: m
// Run with: npx tsx --test components/lib/httpClient.test.ts
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mockResult } from "@/lib/mock";
import type { AnalysisResult } from "@/lib/schema";
import { AnalysisError } from "./errors";
import { httpClient } from "./httpClient";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const LETTER = new File(["%PDF-1.4"], "letter.pdf", { type: "application/pdf" });

function respondWith(body: unknown, status = 200) {
  globalThis.fetch = async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
    });
}

async function failureCode(): Promise<string> {
  try {
    await httpClient.analyze(LETTER);
  } catch (error) {
    assert.ok(error instanceof AnalysisError);
    return error.code;
  }
  assert.fail("expected the analysis to be rejected");
}

const withCheck = (checkStatus?: "ok" | "failed"): AnalysisResult => ({
  ...mockResult,
  metrics: { ...mockResult.metrics, checkStatus },
});

test("the service's timeout message is reported as a timeout", async () => {
  respondWith(
    {
      ok: false,
      error: "That took longer than expected. Please try again in a moment.",
    },
    500,
  );
  assert.equal(await failureCode(), "timed_out");
});

test("an unlisted service message is a general failure", async () => {
  respondWith(
    { ok: false, error: "Something went wrong on our side. Please try again." },
    500,
  );
  assert.equal(await failureCode(), "processing_failed");
});

test("a reply that isn't JSON is a general failure", async () => {
  respondWith("<html>504 Gateway Timeout</html>", 504);
  assert.equal(await failureCode(), "processing_failed");
});

test("a request that never gets a reply is a connection failure", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  assert.equal(await failureCode(), "upload_failed");
});

test("a cancelled request is not turned into a failure to show", async () => {
  const controller = new AbortController();
  const cancelled = new DOMException("cancelled", "AbortError");
  globalThis.fetch = async () => {
    controller.abort(cancelled);
    throw cancelled;
  };
  await assert.rejects(
    httpClient.analyze(LETTER, { signal: controller.signal }),
    (error) => error === cancelled,
  );
});

test("a failed check is still reported after the reply is read", async () => {
  respondWith({ ok: true, result: withCheck("failed") });
  const result = await httpClient.analyze(LETTER);
  assert.equal(result.metrics.checkStatus, "failed");
});

test("a reply that doesn't report on the check is accepted", async () => {
  respondWith({ ok: true, result: mockResult });
  const result = await httpClient.analyze(LETTER);
  assert.equal(result.metrics.checkStatus, undefined);
});
