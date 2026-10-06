// owner: m
import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ResultsPreview } from "./ResultsPreview";

export const metadata: Metadata = {
  title: "Results preview — Unsealed",
};

interface ResultsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * A preview of the results view on the shared mock data from lib/mock.ts.
 * Real analyses are shown on the home page; nothing is stored between pages.
 *
 *   /results                  three details verified, one unsure
 *   /results?mock=not-found   the same letter with the amount not found
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { mock } = await searchParams;

  return (
    <>
      <ResultsPreview sample={mock === "not-found" ? "not-found" : "partial"} />
      <SiteFooter />
    </>
  );
}
