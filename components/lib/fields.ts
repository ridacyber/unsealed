// owner: m
import {
  FIELD_NAMES,
  type AnalysisResult,
  type Field,
  type FieldName,
  type FieldStatus,
} from "@/lib/schema";
import { resolveCitation } from "./citation";

export const FIELD_META: Record<
  FieldName,
  {
    /** The question this detail answers, as a person would ask it. */
    question: string;
    /** How to refer to the detail mid-sentence. */
    name: string;
    /**
     * Why a "not found" card is blank, when the service's note adds nothing.
     * It says what Unsealed couldn't identify, not that the letter is silent.
     */
    notFound: string;
  }
> = {
  amountOwed: {
    question: "How much?",
    name: "the amount",
    notFound:
      "Unsealed couldn't identify an amount you're asked to pay in this letter, so it leaves this answer blank rather than guessing.",
  },
  deadline: {
    question: "When?",
    name: "the deadline",
    notFound:
      "Unsealed couldn't identify a date you need to act by in this letter, so it leaves this answer blank rather than guessing.",
  },
  requiredAction: {
    question: "What do I need to do?",
    name: "what you need to do",
    notFound:
      "Unsealed couldn't identify anything you're asked to do in this letter, so it leaves this answer blank rather than guessing.",
  },
  consequence: {
    question: "What happens if I ignore it?",
    name: "what happens if you ignore it",
    notFound:
      "Unsealed couldn't identify what happens if you don't act in this letter, so it leaves this answer blank rather than guessing.",
  },
};

/**
 * The status a field is shown with. A "verified" field that arrives without a
 * value has nothing to state, so it is shown as unsure rather than as an
 * empty verified card.
 */
export function displayStatus(field: Field): FieldStatus {
  if (field.status === "verified" && !field.value?.trim()) return "unsure";
  return field.status;
}

/**
 * The status a field is shown with beside its letter. "Verified" means the
 * quoted words were found in the letter, so a verified field whose quote is
 * missing, or isn't found where the service says it is, is shown as unsure.
 * The service's answer itself is left as it was.
 */
export function shownStatus(field: Field, located: boolean): FieldStatus {
  const status = displayStatus(field);
  return status === "verified" && !located ? "unsure" : status;
}

/** The status a result's field is shown with, judged against its letter. */
export function statusIn(result: AnalysisResult, name: FieldName): FieldStatus {
  const field = result.fields[name];
  const located =
    field.citation !== null &&
    resolveCitation(result.documentText, field.citation) !== null;
  return shownStatus(field, located);
}

/** Whether any answer reported as verified is shown as unsure for its quote. */
export function hasHeldBackAnswer(result: AnalysisResult): boolean {
  return FIELD_NAMES.some(
    (name) => statusIn(result, name) !== displayStatus(result.fields[name]),
  );
}

export function countByStatus(
  result: AnalysisResult,
): Record<FieldStatus, number> {
  const counts: Record<FieldStatus, number> = {
    verified: 0,
    unsure: 0,
    not_found: 0,
  };
  for (const name of FIELD_NAMES) {
    counts[statusIn(result, name)] += 1;
  }
  return counts;
}
