// owner: m
import { AlertIcon } from "@/components/ui/icons";
import type { AnalysisResult } from "@/lib/schema";
import { CAUTION } from "./VerificationOverview";

/**
 * True only when the service says its check for conflicting passages did not
 * finish. A result that doesn't report on the check at all (an older
 * response, a prepared sample) is not counted as a failed one.
 */
export function isCheckUnavailable(result: AnalysisResult): boolean {
  return result.metrics.checkStatus === "failed";
}

/**
 * Says that the letter was not checked for passages that disagree, so the
 * absence of a conflict warning is not read as the letter being consistent.
 */
export function CheckUnavailableNotice() {
  return (
    <p className={CAUTION}>
      <AlertIcon className="mt-0.5 shrink-0" />
      <span>
        <strong>Additional consistency check unavailable.</strong> Your letter
        was analyzed, but we couldn&rsquo;t complete the additional check for
        conflicting information. Please review important details carefully.
      </span>
    </p>
  );
}
