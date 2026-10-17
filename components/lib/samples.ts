// owner: m
import { mockNotFound, mockResult } from "@/lib/mock";
import type { AnalysisResult, Citation, Field } from "@/lib/schema";
import { indexDocument, locate } from "@/lib/verify";
import { verifiedConflicts } from "./citation";
import { countByStatus } from "./fields";

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

// Offsets are found the way the service finds them, never typed in by hand.
function citerFor(letter: string): (quote: string) => Citation {
  const index = indexDocument(letter);
  return (quote) => {
    const found = locate(quote, index);
    if (!found) throw new Error(`Sample quote is not in the letter: ${quote}`);
    return { quote, ...found };
  };
}

const citeConflictLetter = citerFor(conflictLetter);

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

// The financial aid notice from lib/mock.ts with its amount taken out, worded
// as the landing page shows it, so the letter really doesn't say how much is
// owed. Nothing else in the letter changes.
const AMOUNT_STATED = "Your tuition balance of $1,250.00 is due by";
const amountLeftOutLetter = mockResult.documentText.replace(
  AMOUNT_STATED,
  "Your tuition balance is due by",
);
if (amountLeftOutLetter === mockResult.documentText) {
  throw new Error(`Sample letter no longer contains: ${AMOUNT_STATED}`);
}

const citeAmountLeftOutLetter = citerFor(amountLeftOutLetter);

/** A field as the notice gives it, quoted from the letter without the amount. */
function inAmountLeftOutLetter(field: Field): Field {
  return field.citation
    ? { ...field, citation: citeAmountLeftOutLetter(field.citation.quote) }
    : field;
}

/**
 * The same notice with no amount in it, to show a detail the letter doesn't
 * give. Its other three answers are the notice's own.
 */
export const mockAmountLeftOut: AnalysisResult = {
  ...mockNotFound,
  id: "mock-amount-left-out",
  documentText: amountLeftOutLetter,
  fields: {
    amountOwed: inAmountLeftOutLetter(mockNotFound.fields.amountOwed),
    deadline: inAmountLeftOutLetter(mockNotFound.fields.deadline),
    requiredAction: inAmountLeftOutLetter(mockNotFound.fields.requiredAction),
    consequence: inAmountLeftOutLetter(mockNotFound.fields.consequence),
  },
};

/**
 * Sample results a visitor can open without uploading anything. The first is
 * the shared mock from lib/mock.ts; the other two are defined above. All are
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
    result: mockAmountLeftOut,
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

/**
 * What a sample's prepared result holds, in a few words: how many answers
 * have each status, and whether two passages disagree. Read from the result
 * itself, so it can't drift from what opening the sample shows.
 */
export function evidenceSummary(result: AnalysisResult): string[] {
  const counts = countByStatus(result);
  const parts: string[] = [];
  if (counts.verified) parts.push(`${counts.verified} verified`);
  if (counts.unsure) parts.push(`${counts.unsure} unsure`);
  if (counts.not_found) parts.push(`${counts.not_found} not found`);
  const conflicts = verifiedConflicts(result).length;
  if (conflicts === 1) parts.push("two passages disagree");
  if (conflicts > 1) parts.push(`${conflicts} pairs of passages disagree`);
  return parts;
}

/** The sender, as the letter's first line gives it. */
export function senderOf(result: AnalysisResult): string {
  return result.documentText.split("\n").find((line) => line.trim())?.trim() ?? "";
}
