// owner: shared (m builds the UI against this until the real pipeline exists)
import type { AnalysisResult, Field } from "./schema";

// Fabricated letter. Not a real document.
const documentText = `HARTWELL STATE UNIVERSITY
Office of Financial Aid

Date: October 1, 2026

Dear Student,

Your 2026-27 financial aid award has been adjusted. Your tuition balance of $1,250.00 is due by November 15, 2026. If payment is not received by that date, a $75 late fee will be applied and your spring registration may be placed on hold.

To keep your award, please submit your signed verification form to the Office of Financial Aid.

Sincerely,
Financial Aid Office`;

const cite = (quote: string) => {
  const start = documentText.indexOf(quote);
  return { quote, start, end: start + quote.length };
};

export const mockResult: AnalysisResult = {
  id: "mock-1",
  documentType: "Financial aid notice",
  documentText,
  summary:
    "Your school says you owe a tuition balance and must pay it by a set date or face a late fee. It also asks for a signed form to keep your aid.",
  fields: {
    amountOwed: {
      status: "verified", value: "$1,250.00", normalized: "1250.00",
      citation: cite("tuition balance of $1,250.00"), confidence: 0.97, note: null,
    },
    deadline: {
      status: "verified", value: "November 15, 2026", normalized: "2026-11-15",
      citation: cite("due by November 15, 2026"), confidence: 0.96, note: null,
    },
    requiredAction: {
      status: "unsure", value: "Pay the balance and/or submit the signed verification form", normalized: null,
      citation: cite("please submit your signed verification form"), confidence: 0.55,
      note: "The letter mentions two things (paying and a form) and gives no deadline for the form. Check with the Financial Aid Office.",
    },
    consequence: {
      status: "verified", value: "$75 late fee, and spring registration may be put on hold", normalized: null,
      citation: cite("a $75 late fee will be applied and your spring registration may be placed on hold"),
      confidence: 0.94, note: null,
    },
  },
  overall: "partial",
  disclaimer: "Unsealed explains documents. It is not legal or financial advice.",
  metrics: { model: "mock-model", inputTokens: 900, outputTokens: 250, latencyMs: 1800, costUsd: 0.0004 },
};

// Same result with one field the letter doesn't state, to test the not_found state.
const missing: Field = {
  status: "not_found", value: null, normalized: null, citation: null, confidence: 0,
  note: "The letter doesn't say.",
};
export const mockNotFound: AnalysisResult = {
  ...mockResult,
  id: "mock-2",
  fields: { ...mockResult.fields, amountOwed: missing },
};
