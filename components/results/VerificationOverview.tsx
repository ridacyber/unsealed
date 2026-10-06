// owner: m
import { countByStatus } from "@/components/lib/fields";
import { CheckIcon, QuestionIcon } from "@/components/ui/icons";
import { FIELD_NAMES, type AnalysisResult } from "@/lib/schema";

const CAUTION =
  "flex gap-3 rounded-xl border border-unsure-line bg-unsure-tint p-4 text-unsure";

/**
 * States up front whether anything was left unconfirmed, so a page of
 * answers is never mistaken for a page of verified answers.
 */
export function VerificationOverview({ result }: { result: AnalysisResult }) {
  const counts = countByStatus(result);
  const total = FIELD_NAMES.length;
  const unconfirmed = counts.unsure + counts.not_found;

  if (result.overall === "abstained" || unconfirmed === total) {
    return (
      <p className={CAUTION}>
        <QuestionIcon className="mt-0.5 shrink-0" />
        <span>
          <strong>
            Unsealed couldn&rsquo;t confirm the details of this letter.
          </strong>{" "}
          Rather than guess, it has left them open. Read the letter itself, or
          ask the sender or someone you trust.
        </span>
      </p>
    );
  }

  if (unconfirmed === 0) {
    return (
      <p className="flex gap-3 rounded-xl bg-verified-tint p-4 text-verified">
        <CheckIcon className="mt-0.5 shrink-0" />
        <span>
          <strong>All {total} details are stated in your letter.</strong> Open
          any of them to see the exact words.
        </span>
      </p>
    );
  }

  return (
    <p className={CAUTION}>
      <QuestionIcon className="mt-0.5 shrink-0" />
      <span>
        <strong>
          {unconfirmed} of {total} details couldn&rsquo;t be confirmed.
        </strong>{" "}
        Unsealed doesn&rsquo;t guess. Check the marked details against your
        letter, or ask the sender.
      </span>
    </p>
  );
}
