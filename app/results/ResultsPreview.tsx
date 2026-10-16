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
import type { Fixture } from "./fixtures";

const LINK = "rw-link mr-4 inline-block";

// A fixture arrives already chosen by the server page, so the fixtures
// themselves never ship to the browser.
type ResultsPreviewProps = { sample: SampleId; fixture?: never } | { fixture: Fixture; sample?: never };

export function ResultsPreview(props: ResultsPreviewProps) {
  const router = useRouter();
  const goHome = () => router.push("/");

  const view = props.fixture
    ? (() => {
        const { id, title, result, checks } = props.fixture;
        return {
          key: `fixture-${id}`,
          title,
          result,
          notice: (
            <>
              <strong>Test fixture: a made-up letter with prepared answers.</strong>{" "}
              It isn&rsquo;t an analysis and no AI call was made. It checks how
              results are shown: {checks.toLowerCase()}.
            </>
          ),
        };
      })()
    : (() => {
        const sample = props.sample;
        const { title, result } = getSample(sample);
        return {
          key: sample,
          title,
          result,
          notice: (
            <>
              <strong>Preview: this is sample data.</strong> It shows a
              sample result, not a letter you uploaded.{" "}
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
          ),
        };
      })();

  return (
    // The results sit on the midnight desk, as they do after an analysis.
    <div className="surface-midnight flex flex-1 flex-col">
      <SiteHeader onStartOver={goHome} showDemoTag wide surface="midnight" />

      <main className="flex-1">
        <ResultsView
          // A fresh view per sample, so no evidence stays open across them.
          key={view.key}
          result={view.result}
          letterName={view.title}
          notice={view.notice}
          onStartOver={goHome}
        />
      </main>
    </div>
  );
}
