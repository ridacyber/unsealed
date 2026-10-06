// owner: m
"use client";

import { SAMPLE_LETTERS, type SampleId } from "@/components/lib/samples";
import { ChevronIcon } from "@/components/ui/icons";

export function SampleLetters({
  onChoose,
}: {
  onChoose: (id: SampleId) => void;
}) {
  return (
    <section aria-labelledby="samples-heading">
      <h2 id="samples-heading" className="font-display text-2xl font-semibold">
        No letter to hand? Try a sample.
      </h2>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">
        Two results for one made-up letter. They show how Unsealed responds
        when a detail can&rsquo;t be confirmed, and when it isn&rsquo;t stated
        at all.
      </p>

      <ul className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        {SAMPLE_LETTERS.map((sample) => (
          <li key={sample.id}>
            <button
              type="button"
              onClick={() => onChoose(sample.id)}
              className="group flex h-full w-full flex-col rounded-xl border border-line bg-sheet p-5 text-left transition-colors hover:border-postal"
            >
              <span className="font-display text-lg font-semibold">
                {sample.title}
              </span>
              <span className="mt-1 text-ink-soft">{sample.shows}</span>
              <span className="mt-auto flex items-center gap-1 pt-5 font-semibold text-postal">
                Open this sample
                <ChevronIcon
                  direction="right"
                  width={18}
                  height={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
