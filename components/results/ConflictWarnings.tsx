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
 * takes no side: which passage is right is for the sender to say.
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
    <section
      aria-labelledby={headingId}
      className="relative overflow-hidden rounded-xl border border-unsure-line bg-unsure-tint p-5 pl-7 sm:p-6 sm:pl-8"
    >
      <span
        aria-hidden="true"
        className="unsure-band absolute inset-y-0 left-0 w-2"
      />

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
          className={
            index === 0 ? "mt-5" : "mt-6 border-t border-unsure-line pt-5"
          }
        >
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
                    className={`flex flex-col rounded-lg border bg-sheet p-4 ${
                      isActive ? "border-postal ring-2 ring-postal" : "border-line"
                    }`}
                  >
                    <figcaption className="text-sm font-semibold text-ink-soft">
                      {PASSAGE_CAPTIONS[side]}
                    </figcaption>
                    <blockquote
                      id={quoteId}
                      className="mt-1.5 font-quote text-[1.05rem] leading-relaxed break-words"
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
                        className="inline-flex min-h-11 items-center text-left font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal"
                      >
                        Show passage {side + 1} in your letter
                      </button>
                      {isActive && (
                        <a
                          href="#your-letter"
                          className="mt-1 block font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal lg:hidden"
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
