// owner: m
import { mockNotFound, mockResult } from "@/lib/mock";
import type { AnalysisResult, Citation } from "@/lib/schema";
import { indexDocument, locate } from "@/lib/verify";

export type SampleId = "partial" | "not-found" | "conflict";

// Fabricated letter. Not a real document. Its summary box and its body give
// different amounts.
const conflictLetter = `NORTHFIELD COMMUNITY COLLEGE
Student Accounts Office

Date: September 28, 2026

Re: Fall 2026 statement of account

ACCOUNT SUMMARY
Balance due: $1,827.00
Payment due date: October 30, 2026

Dear Student,

Our records show that you owe the College $1,872.00 for Fall 2026 tuition and fees. Please pay your balance in full by October 30, 2026. You can pay online through the student portal or in person at the Student Accounts Office.

If your balance is not paid by the due date, a hold will be placed on your account and you will not be able to register for Spring 2027 classes.

Sincerely,
Student Accounts Office`;

const conflictLetterIndex = indexDocument(conflictLetter);

// Offsets are found the way the service finds them, never typed in by hand.
function citeConflictLetter(quote: string): Citation {
  const found = locate(quote, conflictLetterIndex);
  if (!found) throw new Error(`Sample quote is not in the letter: ${quote}`);
  return { quote, ...found };
}

/** A letter that disagrees with itself, to show the conflict warning. */
export const mockConflict: AnalysisResult = {
  id: "mock-conflict",
  documentType: "Statement of account",
  documentText: conflictLetter,
  summary:
    "Your college says you owe a balance for Fall 2026 and must pay it by a set date, or a hold goes on your account. The letter gives two different amounts.",
  fields: {
    amountOwed: {
      status: "unsure",
      value: "$1,827.00",
      normalized: "1827.00",
      citation: citeConflictLetter("Balance due: $1,827.00"),
      confidence: 0.4,
      note: "The letter gives two different amounts: $1,827.00 in the account summary and $1,872.00 in the body. Confirm the right amount with the Student Accounts Office.",
    },
    deadline: {
      status: "verified",
      value: "October 30, 2026",
      normalized: "2026-10-30",
      citation: citeConflictLetter("Payment due date: October 30, 2026"),
      confidence: 0.96,
      note: null,
    },
    requiredAction: {
      status: "verified",
      value:
        "Pay your balance in full, online or at the Student Accounts Office",
      normalized: null,
      citation: citeConflictLetter(
        "Please pay your balance in full by October 30, 2026",
      ),
      confidence: 0.93,
      note: null,
    },
    consequence: {
      status: "verified",
      value:
        "A hold on your account, and you can't register for Spring 2027 classes",
      normalized: null,
      citation: citeConflictLetter(
        "a hold will be placed on your account and you will not be able to register for Spring 2027 classes",
      ),
      confidence: 0.94,
      note: null,
    },
  },
  overall: "partial",
  warnings: [
    {
      kind: "conflict",
      message:
        "The letter gives two different amounts: $1,827.00 and $1,872.00.",
      quotes: [
        citeConflictLetter("Balance due: $1,827.00"),
        citeConflictLetter("you owe the College $1,872.00"),
      ],
    },
  ],
  disclaimer: mockResult.disclaimer,
  metrics: {
    model: "mock-model",
    inputTokens: 950,
    outputTokens: 320,
    latencyMs: 2100,
    costUsd: 0.0005,
  },
};

/**
 * Sample results a visitor can open without uploading anything. The first two
 * are the shared mocks from lib/mock.ts; the third is defined above. All are
 * typed by the shared schema, so the UI and the backend agree on their shape
 * by construction.
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
  {
    id: "conflict",
    title: "A statement with two amounts",
    shows: "How Unsealed points out two passages that may not agree",
    result: mockConflict,
  },
];

export function getSample(id: SampleId): SampleLetterInfo {
  const sample = SAMPLE_LETTERS.find((candidate) => candidate.id === id);
  if (!sample) throw new Error(`Unknown sample: ${id}`);
  return sample;
}
