// owner: m
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  getSample,
  SAMPLE_LETTERS,
  type SampleId,
} from "@/components/lib/samples";
import { ResultsView } from "@/components/results/ResultsView";

const LINK =
  "font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal";

export function ResultsPreview({ sample }: { sample: SampleId }) {
  const router = useRouter();
  const { title, result } = getSample(sample);
  const goHome = () => router.push("/");

  return (
    <>
      <SiteHeader onStartOver={goHome} showDemoTag wide />

      <main className="flex-1">
        <ResultsView
          // A fresh view per sample, so no evidence stays open across them.
          key={sample}
          result={result}
          letterName={title}
          notice={
            <>
              <strong>Preview: this is sample data.</strong> It shows the
              shared mock results, not a letter you uploaded.{" "}
              {SAMPLE_LETTERS.filter(({ id }) => id !== sample).map((other) => (
                <Link
                  key={other.id}
                  href={
                    other.id === "partial"
                      ? "/results"
                      : `/results?mock=${other.id}`
                  }
                  className={LINK}
                >
                  See &ldquo;{other.title}&rdquo;
                </Link>
              ))}
            </>
          }
          onStartOver={goHome}
        />
      </main>
    </>
  );
}
