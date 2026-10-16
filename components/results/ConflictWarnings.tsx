// owner: m
"use client";

import { useId } from "react";
import type { VerifiedConflict } from "@/components/lib/citation";
import { AlertIcon } from "@/components/ui/icons";

/** Which passage is being shown in the letter: the conflict, then the side. */
export interface ConflictSelection {
  index: number;
  side: 0 | 1;
}

const PASSAGE_CAPTIONS = ["In one place", "In another place"] as const;

interface ConflictWarningsProps {
  /** Conflicts whose two passages are both confirmed in the letter. */
  conflicts: VerifiedConflict[];
  active: ConflictSelection | null;
  onSelect: (selection: ConflictSelection | null) => void;
}

/**
 * Says that two passages of the letter may not agree, and shows both. It
 * takes no side: which passage is right is for the sender to say. Each
 * conflict stands alone; nothing here ties it to a particular answer.
 */
export function ConflictWarnings({
  conflicts,
  active,
  onSelect,
}: ConflictWarningsProps) {
  const headingId = useId();
  const quoteIdBase = useId();

  if (conflicts.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="rw-slip rw-dispute">
      <span aria-hidden="true" className="unsure-band rw-card-band" />

      <h2
        id={headingId}
        className="flex gap-2 font-display text-xl font-semibold text-unsure"
      >
        <AlertIcon width={24} height={24} className="mt-0.5 shrink-0" />
        Possible conflicting information
      </h2>
      <p className="mt-2 text-lg leading-relaxed">
        Unsealed found two passages in your letter that may not agree. It
        can&rsquo;t tell which one is correct. Please confirm the right
        information with the sender before you act.
      </p>

      {conflicts.map((conflict, index) => (
        <div
          key={index}
          className={index === 0 ? "mt-5" : "rw-dispute-next"}
        >
          {conflicts.length > 1 && (
            <p className="rw-dispute-count">
              Possible conflict {index + 1} of {conflicts.length}
            </p>
          )}
          <h3 className="text-sm font-semibold text-ink-soft">
            What Unsealed noticed
          </h3>
          <p className="mt-1 text-lg leading-relaxed">{conflict.message}</p>

          <div className="@container mt-4">
            <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
              {conflict.passages.map((passage, side) => {
                const isActive =
                  active?.index === index && active.side === side;
                const quoteId = `${quoteIdBase}-${index}-${side}`;
                return (
                  <figure
                    key={side}
                    data-active={isActive ? "" : undefined}
                    data-evidence-source={isActive ? "" : undefined}
                    className="rw-passage"
                  >
                    <figcaption className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                      <span aria-hidden="true" className="rw-passage-tag">
                        {side + 1}
                      </span>
                      {PASSAGE_CAPTIONS[side]}
                    </figcaption>
                    <blockquote
                      id={quoteId}
                      className="mt-2 font-quote text-[1rem] leading-[1.65] break-words"
                    >
                      &ldquo;{passage.quote}&rdquo;
                    </blockquote>
                    <div className="mt-auto pt-2">
                      <button
                        type="button"
                        aria-pressed={isActive}
                        aria-describedby={quoteId}
                        onClick={() =>
                          onSelect(
                            isActive
                              ? null
                              : { index, side: side === 0 ? 0 : 1 },
                          )
                        }
                        className="rw-evidence-toggle mt-0 text-left"
                      >
                        Show passage {side + 1} in your letter
                      </button>
                      {isActive && (
                        <a
                          href="#your-letter"
                          className="rw-link mt-1 block lg:hidden"
                        >
                          See it in your letter
                        </a>
                      )}
                    </div>
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
