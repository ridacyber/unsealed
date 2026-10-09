// owner: m
"use client";

import { useState } from "react";
import { ErrorView } from "@/components/errors/ErrorView";
import {
  sourceLabel,
  useAnalysis,
  type AnalysisSource,
} from "@/components/hooks/useAnalysis";
import { Landing } from "@/components/landing/Landing";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProcessingView } from "@/components/processing/ProcessingView";
import { ResultsView } from "@/components/results/ResultsView";

/** The whole flow: upload, processing, then results or a failure state. */
export function UnsealedApp() {
  const { state, start, reset, mode } = useAnalysis();
  const [hasStarted, setHasStarted] = useState(false);

  function handleAnalyze(source: AnalysisSource) {
    setHasStarted(true);
    start(source);
  }

  // In a demo build an uploaded file gets canned answers about another letter.
  const isCannedUpload =
    state.phase === "done" && mode === "mock" && state.source.kind === "upload";

  return (
    <>
      <SiteHeader
        onStartOver={state.phase === "idle" ? undefined : reset}
        showDemoTag={mode === "mock"}
        wide={state.phase === "done"}
      />

      <main className="flex-1">
        {state.phase === "idle" && (
          <Landing
            onAnalyze={handleAnalyze}
            mode={mode}
            returning={hasStarted}
          />
        )}

        {state.phase === "processing" && (
          <ProcessingView
            fileName={sourceLabel(state.source)}
            stage={state.stage}
            onCancel={reset}
          />
        )}

        {state.phase === "done" && (
          <ResultsView
            result={state.result}
            letterName={
              isCannedUpload ? "Sample letter" : sourceLabel(state.source)
            }
            notice={
              isCannedUpload && (
                <>
                  <strong>Demo build: this is sample data.</strong> Analysis
                  isn&rsquo;t connected yet, so the answers below describe one
                  of our sample letters, not the file you uploaded.
                </>
              )
            }
            onStartOver={reset}
          />
        )}

        {state.phase === "failed" && (
          <ErrorView
            code={state.code}
            fileName={sourceLabel(state.source)}
            onRetry={() => start(state.source)}
            onStartOver={reset}
          />
        )}
      </main>
    </>
  );
}
