// owner: m
"use client";

import { useEffect, useRef } from "react";
import type { AnalysisSource } from "@/components/hooks/useAnalysis";
import { SampleLetters } from "@/components/upload/SampleLetters";
import { UploadPanel } from "@/components/upload/UploadPanel";
import { EnvelopeScene } from "./EnvelopeScene";
import { HonestySection } from "./HonestySection";

const PRIVACY_NOTES = {
  mock: "This is a demo build. Your file stays in this browser and isn't sent anywhere.",
  live: "When you choose Analyze, your PDF is sent to Unsealed, and the text of your letter is processed by Nebius, an external AI provider. Letters often contain personal details, so only upload what you're comfortable sharing.",
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
    // The light around the envelope may reach past the window's edge.
    <div className="overflow-x-clip">
      {/* The hero: the headline and the upload beside the envelope. On a
          phone the envelope follows the upload, so the upload is never far
          away. On a small laptop the text column gives up a little width,
          so the envelope keeps enough to show its passages, and both
          columns start at the top, as the envelope's notes stack under it. */}
      <section className="mx-auto w-full max-w-[86rem] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-12 pt-6 pb-14 sm:pt-10 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:pt-14 lg:pb-24 xl:items-center min-[90rem]:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] min-[90rem]:gap-x-16">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-fog uppercase">
              <span aria-hidden="true" className="eyebrow-rule" />
              Re: bills, notices and demands
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-5 font-display text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.025em] text-balance sm:text-[3.25rem] lg:text-[3.5rem] min-[90rem]:text-[3.85rem]"
            >
              Make sense of an{" "}
              <em className="font-medium text-ice">official letter</em>.
            </h1>
            <p className="mt-5 max-w-[30rem] text-lg leading-[1.55] text-fog">
              Upload a bill, notice or demand. Unsealed explains it in plain
              English and shows you the exact words in the letter behind every
              answer.
            </p>

            <UploadPanel
              onAnalyze={(file) => onAnalyze({ kind: "upload", file })}
              privacyNote={PRIVACY_NOTES[mode]}
            />
          </div>

          <EnvelopeScene />
        </div>
      </section>

      {/* Still on the desk: the same letter, read for how sure each answer
          is. */}
      <HonestySection />

      {/* Then onto paper, where a sample can be opened. */}
      <div className="band-paper band-dawn pb-12 sm:pb-16 lg:pb-20">
        <div className="mx-auto w-full max-w-[80rem] px-5 sm:px-8">
          <SampleLetters
            onChoose={(id) => onAnalyze({ kind: "sample", id })}
            live={mode === "live"}
          />
        </div>
      </div>
    </div>
  );
}
