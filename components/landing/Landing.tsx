// owner: m
"use client";

import { useEffect, useRef } from "react";
import type { AnalysisSource } from "@/components/hooks/useAnalysis";
import { SampleLetters } from "@/components/upload/SampleLetters";
import { UploadPanel } from "@/components/upload/UploadPanel";
import { HonestySection } from "./HonestySection";

const QUESTIONS = [
  "What does this letter mean?",
  "How much?",
  "When?",
  "What do I need to do?",
  "What happens if I ignore it?",
];

const PRIVACY_NOTES = {
  mock: "This is a demo build. Your file stays in this browser and isn't sent anywhere.",
  live: "Your letter is sent to Unsealed so it can be read. Letters often contain personal details, so only upload what you're comfortable sharing.",
};

interface LandingProps {
  onAnalyze: (source: AnalysisSource) => void;
  mode: "mock" | "live";
  /** True when the person has come back here from another view. */
  returning: boolean;
}

export function Landing({ onAnalyze, mode, returning }: LandingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!returning) return;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [returning]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
      {/* On small screens the upload panel comes before the question list. */}
      <section className="grid items-start gap-x-16 gap-y-10 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:pt-14">
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[2.6rem] leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Make sense of an official letter.
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">
            Upload a bill, notice or demand. Unsealed explains it in plain
            English and shows you the exact words in the letter behind every
            answer.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <UploadPanel
            onAnalyze={(file) => onAnalyze({ kind: "upload", file })}
            privacyNote={PRIVACY_NOTES[mode]}
          />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <h2 className="text-sm font-semibold tracking-widest text-ink-soft uppercase">
            Five questions, answered
          </h2>
          <ul className="mt-3 max-w-md divide-y divide-line border-y border-line">
            {QUESTIONS.map((question) => (
              <li key={question} className="py-3 font-display text-xl">
                {question}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="space-y-16">
        <SampleLetters onChoose={(id) => onAnalyze({ kind: "sample", id })} />
        <HonestySection />
      </div>
    </div>
  );
}
