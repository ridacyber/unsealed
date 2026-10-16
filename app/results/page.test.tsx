// owner: m
// Run with: npx tsx --test app/results/page.test.tsx
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { ReactElement } from "react";
import { fixturesEnabled } from "./fixtures";
import ResultsPage from "./page";
import { ResultsPreview } from "./ResultsPreview";

const saved = {
  NODE_ENV: process.env.NODE_ENV,
  UNSEALED_TEST_FIXTURES: process.env.UNSEALED_TEST_FIXTURES,
};

function setEnv(env: { NODE_ENV?: string; UNSEALED_TEST_FIXTURES?: string }) {
  for (const key of ["NODE_ENV", "UNSEALED_TEST_FIXTURES"] as const) {
    if (env[key] === undefined) delete process.env[key];
    else (process.env as Record<string, string>)[key] = env[key];
  }
}

afterEach(() => setEnv(saved));

type PreviewElement = ReactElement<Parameters<typeof ResultsPreview>[0]>;

async function open(query: Record<string, string>): Promise<PreviewElement> {
  const element = (await ResultsPage({ searchParams: Promise.resolve(query) })) as PreviewElement;
  assert.equal(element.type, ResultsPreview);
  return element;
}

test("fixtures are allowed while developing or when the server opts in, and nowhere else", () => {
  assert.equal(fixturesEnabled({ NODE_ENV: "development" }), true);
  assert.equal(fixturesEnabled({ NODE_ENV: "production", UNSEALED_TEST_FIXTURES: "1" }), true);
  assert.equal(fixturesEnabled({ NODE_ENV: "production" }), false);
  assert.equal(fixturesEnabled({ NODE_ENV: "test" }), false);
  assert.equal(fixturesEnabled({}), false);
  // Only the exact opt-in counts.
  for (const value of ["0", "true", "yes", "", " 1"]) {
    assert.equal(fixturesEnabled({ NODE_ENV: "production", UNSEALED_TEST_FIXTURES: value }), false, value);
  }
});

test("a production server without the opt-in shows the public sample instead of a fixture", async () => {
  setEnv({ NODE_ENV: "production" });
  for (const fixture of ["mixed", "multi-conflict", "check-failed"]) {
    const { props } = await open({ fixture });
    assert.equal(props.fixture, undefined, fixture);
    assert.equal(props.sample, "partial", fixture);
  }
});

test("the public samples are unaffected by the fixture setting", async () => {
  for (const env of [{ NODE_ENV: "production" }, { NODE_ENV: "production", UNSEALED_TEST_FIXTURES: "1" }]) {
    setEnv(env);
    assert.equal((await open({})).props.sample, "partial");
    assert.equal((await open({ mock: "not-found" })).props.sample, "not-found");
    assert.equal((await open({ mock: "conflict" })).props.sample, "conflict");
  }
});

test("where allowed, the page hands the chosen fixture to the preview", async () => {
  setEnv({ NODE_ENV: "production", UNSEALED_TEST_FIXTURES: "1" });
  const { props } = await open({ fixture: "multi-conflict" });
  assert.equal(props.fixture?.id, "multi-conflict");
  assert.equal(props.fixture?.result.id, "fixture-multi-conflict");

  setEnv({ NODE_ENV: "development" });
  assert.equal((await open({ fixture: "long" })).props.fixture?.id, "long");
  // An unknown id is not a fixture, even where fixtures are allowed.
  assert.equal((await open({ fixture: "nope" })).props.sample, "partial");
});
