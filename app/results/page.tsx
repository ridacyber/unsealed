// owner: m
import type { Metadata } from "next";
import { fixturesEnabled, getFixture, isFixtureId } from "./fixtures";
import { ResultsPreview } from "./ResultsPreview";

export const metadata: Metadata = {
  title: "Results preview — Unsealed",
  // A preview of prepared data, not a page to be found in search.
  robots: { index: false, follow: false },
};

interface ResultsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * A preview of the results view on the sample data in
 * components/lib/samples.ts. Real analyses are shown on the home page; nothing
 * is stored between pages.
 *
 *   /results                  three details verified, one unsure
 *   /results?mock=not-found   the same letter with the amount not found
 *   /results?mock=conflict    a letter that gives two different amounts
 *
 * Unlisted, for checking the layout: /results?fixture=<id>, with the ids in
 * ./fixtures.ts. Each is labelled on the page as a made-up test fixture.
 * They're served only where `fixturesEnabled` allows (never on a deployment
 * by default), and resolved here so the fixtures stay out of the browser
 * bundle.
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { mock, fixture } = await searchParams;
  // Read per request, after the request's own data, so a built app follows
  // the server's environment rather than the build machine's.
  const allowFixtures = fixturesEnabled({
    NODE_ENV: process.env.NODE_ENV,
    UNSEALED_TEST_FIXTURES: process.env.UNSEALED_TEST_FIXTURES,
  });
  if (allowFixtures && isFixtureId(fixture)) {
    return <ResultsPreview fixture={getFixture(fixture)} />;
  }

  const sample = mock === "not-found" || mock === "conflict" ? mock : "partial";
  return <ResultsPreview sample={sample} />;
}
