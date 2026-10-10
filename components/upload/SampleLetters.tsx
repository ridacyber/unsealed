// owner: m
"use client";

import { SAMPLE_LETTERS, type SampleId } from "@/components/lib/samples";
import { ChevronIcon, DocumentIcon } from "@/components/ui/icons";

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
      <h2 id="samples-heading" className="font-display text-2xl font-semibold">
        No letter to hand? Try a sample.
      </h2>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">
        Three results for made-up letters. They show how Unsealed responds
        when a detail can&rsquo;t be confirmed, when it isn&rsquo;t stated at
        all, and when a letter disagrees with itself. They were prepared in
        advance, so opening one makes no AI call.
      </p>

      <ul className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
        {SAMPLE_LETTERS.map((sample) => (
          <li key={sample.id}>
            <button
              type="button"
              onClick={() => onChoose(sample.id)}
              className="group flex h-full w-full flex-col rounded-xl border border-line bg-sheet p-5 text-left transition-colors hover:border-postal"
            >
              <span className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
                Prepared in advance
              </span>
              <span className="mt-1 font-display text-lg font-semibold">
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

      <h3 className="mt-8 font-display text-lg font-semibold">
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
    </section>
  );
}
