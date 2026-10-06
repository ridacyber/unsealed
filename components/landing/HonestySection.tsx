// owner: m
import { StatusBadge } from "@/components/results/StatusBadge";
import type { FieldStatus } from "@/lib/schema";

const STATES: ReadonlyArray<{ status: FieldStatus; meaning: string }> = [
  {
    status: "verified",
    meaning:
      "The letter states it. You can see the exact words, and where they sit in the letter.",
  },
  {
    status: "unsure",
    meaning:
      "The wording is vague, or it couldn't be confirmed against the letter. You see what the letter says, without a guess from us.",
  },
  {
    status: "not_found",
    meaning:
      "The letter doesn't say. We tell you that and leave the gap empty.",
  },
];

export function HonestySection() {
  return (
    <section
      aria-labelledby="honesty-heading"
      className="rounded-2xl border border-line bg-sheet p-6 sm:p-10"
    >
      <h2
        id="honesty-heading"
        className="max-w-2xl font-display text-2xl font-semibold text-balance sm:text-3xl"
      >
        When the letter isn&rsquo;t clear, Unsealed says so.
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        A wrong date or amount is worse than none. Every detail is marked with
        how sure we are.
      </p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-3">
        {STATES.map(({ status, meaning }) => (
          <div key={status} className="border-t border-line pt-5">
            <dt>
              <StatusBadge status={status} />
            </dt>
            <dd className="mt-3 text-ink-soft">{meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
