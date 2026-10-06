// owner: m
import {
  FIELD_NAMES,
  type AnalysisResult,
  type Field,
  type FieldName,
  type FieldStatus,
} from "@/lib/schema";

export const FIELD_META: Record<
  FieldName,
  {
    /** The question this detail answers, as a person would ask it. */
    question: string;
    /** How to refer to the detail mid-sentence. */
    name: string;
  }
> = {
  amountOwed: { question: "How much?", name: "the amount" },
  deadline: { question: "When?", name: "the deadline" },
  requiredAction: {
    question: "What do I need to do?",
    name: "what you need to do",
  },
  consequence: {
    question: "What happens if I ignore it?",
    name: "what happens if you ignore it",
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

export function countByStatus(
  result: AnalysisResult,
): Record<FieldStatus, number> {
  const counts: Record<FieldStatus, number> = {
    verified: 0,
    unsure: 0,
    not_found: 0,
  };
  for (const name of FIELD_NAMES) {
    counts[displayStatus(result.fields[name])] += 1;
  }
  return counts;
}
