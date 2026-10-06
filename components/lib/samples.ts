// owner: m
import { mockNotFound, mockResult } from "@/lib/mock";
import type { AnalysisResult } from "@/lib/schema";

export type SampleId = "partial" | "not-found";

/**
 * Sample results a visitor can open without uploading anything. They are the
 * shared mocks from lib/mock.ts, so the UI and the backend agree on their
 * shape by construction.
 */
export interface SampleLetterInfo {
  id: SampleId;
  title: string;
  /** What this sample demonstrates, in a few words. */
  shows: string;
  result: AnalysisResult;
}

export const SAMPLE_LETTERS: readonly SampleLetterInfo[] = [
  {
    id: "partial",
    title: "Financial aid notice",
    shows: "Three details stated clearly, one left unconfirmed",
    result: mockResult,
  },
  {
    id: "not-found",
    title: "The same notice, amount left out",
    shows: "How a detail looks when Unsealed reports it as not stated",
    result: mockNotFound,
  },
];

export function getSample(id: SampleId): SampleLetterInfo {
  const sample = SAMPLE_LETTERS.find((candidate) => candidate.id === id);
  if (!sample) throw new Error(`Unknown sample: ${id}`);
  return sample;
}
