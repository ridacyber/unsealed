// owner: m
"use client";

import { statusIn } from "@/components/lib/fields";
import {
  evidenceSummary,
  SAMPLE_LETTERS,
  senderOf,
  type SampleId,
} from "@/components/lib/samples";
import { ChevronIcon, DocumentIcon } from "@/components/ui/icons";
import { FIELD_NAMES } from "@/lib/schema";
import styles from "./SampleLetters.module.css";

const LINK =
  "font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal";

export function SampleLetters({
  onChoose,
  live,
}: {
  onChoose: (id: SampleId) => void;
  /** Whether an uploaded file is sent for a real analysis. */
  live: boolean;
}) {
  return (
    <section aria-labelledby="samples-heading">
      <div className="grid grid-cols-1 gap-x-16 gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:items-end">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
            <span aria-hidden="true" className="eyebrow-rule" />
            Samples
          </p>
          <h2
            id="samples-heading"
            className="mt-3 font-display text-[2.15rem] leading-[1.08] font-semibold tracking-[-0.02em] text-balance sm:text-[2.75rem] lg:text-[3.25rem]"
          >
            No letter to hand?{" "}
            <em className="font-medium text-postal-deep">Open a sample.</em>
          </h2>
        </div>
        <p className="text-lg leading-[1.55] text-ink-soft">
          Three made-up letters with results prepared in advance. They show
          how Unsealed responds when a detail can&rsquo;t be confirmed, when
          it isn&rsquo;t stated at all, and when a letter disagrees with
          itself. Opening one makes no AI call.
        </p>
      </div>

      <ul className={styles.list}>
        {SAMPLE_LETTERS.map((sample) => (
          <li key={sample.id}>
            <button
              type="button"
              onClick={() => onChoose(sample.id)}
              className={styles.card}
            >
              {/* The letter, half out of its envelope; it rises a little
                  when the card is pointed at or focused. */}
              <span className={`envelope-lining ${styles.window}`} aria-hidden="true">
                <span className={styles.sheet}>
                  <span className={styles.sender}>{senderOf(sample.result)}</span>
                  <span className={styles.lines}>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span className={styles.pocket} />
              </span>

              <span className={styles.body}>
                <span className={styles.kicker}>Prepared in advance</span>
                <span className={styles.title}>{sample.title}</span>
                <span className={styles.shows}>{sample.shows}</span>
                <span className={styles.tally}>
                  {/* One mark per answer, in the order the results show
                      them, dressed like the answers themselves. */}
                  <span className={styles.marks} aria-hidden="true">
                    {FIELD_NAMES.map((name) => (
                      <i
                        key={name}
                        data-status={statusIn(sample.result, name)}
                      />
                    ))}
                  </span>
                  <span>
                    {evidenceSummary(sample.result).map((part, index) => (
                      <span key={part}>
                        {index > 0 && " · "}
                        <span className={styles.tallyPart}>{part}</span>
                      </span>
                    ))}
                  </span>
                </span>
                <span className={styles.cta}>
                  Open this sample
                  <ChevronIcon
                    direction="right"
                    width={18}
                    height={18}
                    className={styles.chevron}
                  />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.upload}>
        <h3 className="font-display text-xl font-semibold">
          Or try a real upload
        </h3>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Download this made-up tuition balance notice, then add it under{" "}
          <a href="#upload-heading" className={LINK}>
            Add your letter
          </a>
          .{" "}
          {live
            ? "Unlike the samples above, an upload is sent to Unsealed for a live analysis, and the text of the letter is processed by Nebius, an external AI provider. That may take a little while."
            : "In this demo build, uploads show sample data and nothing is sent anywhere."}
        </p>
        <a
          href="/samples/Unsealed-L01-Test-Letter.pdf"
          download
          className={`mt-2 inline-flex min-h-11 items-center gap-2 ${LINK}`}
        >
          <DocumentIcon className="shrink-0" />
          Download sample PDF{" "}
          <span className="font-normal text-ink-soft">(34 KB)</span>
        </a>
      </div>
    </section>
  );
}
