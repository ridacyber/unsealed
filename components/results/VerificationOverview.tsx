// owner: m
import { countByStatus } from "@/components/lib/fields";
import { CheckIcon, QuestionIcon } from "@/components/ui/icons";
import { FIELD_NAMES, type AnalysisResult } from "@/lib/schema";

// Notices are slips of paper on the desk, so their colours stay the ones
// checked for contrast on paper.
export const CAUTION = "rw-notice rw-notice-caution flex gap-3 p-4 text-unsure";

/**
 * States up front whether anything was left unconfirmed, so a page of
 * answers is never mistaken for a page of verified answers.
 */
export function VerificationOverview({
  result,
  possibleConflict = false,
  checkUnavailable = false,
}: {
  result: AnalysisResult;
  /** True when the letter is shown to hold passages that may not agree. */
  possibleConflict?: boolean;
  /** True when the check for conflicting passages could not be completed. */
  checkUnavailable?: boolean;
}) {
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

  // Each detail can match the letter's words while the letter disagrees with
  // itself, so this is never reported as a plain success.
  if (unconfirmed === 0 && possibleConflict) {
    return (
      <p className={CAUTION}>
        <QuestionIcon className="mt-0.5 shrink-0" />
        <span>
          <strong>
            Each detail below is quoted from your letter, but the letter may
            disagree with itself.
          </strong>{" "}
          Check the passages above and confirm with the sender before you act.
        </span>
      </p>
    );
  }

  // The check for passages that disagree didn't finish, so having none to
  // show says nothing about the letter. The notice above explains why; this
  // only holds back the plain success.
  if (unconfirmed === 0 && checkUnavailable) {
    return (
      <p className={CAUTION}>
        <QuestionIcon className="mt-0.5 shrink-0" />
        <span>
          <strong>
            Supporting passages are available for all four details.
          </strong>{" "}
          Review them carefully against your letter before acting.
        </span>
      </p>
    );
  }

  if (unconfirmed === 0) {
    return (
      <p className="rw-notice rw-notice-verified flex gap-3 p-4 text-verified">
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
