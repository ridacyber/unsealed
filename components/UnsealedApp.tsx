// owner: m
"use client";

import { useState } from "react";
import { ErrorView } from "@/components/errors/ErrorView";
import {
  screenFor,
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
  // A sample's answers were written ahead of time; nothing analyzes it.
  const isSample = state.phase !== "idle" && state.source.kind === "sample";
  const screen = screenFor(state);

  // Every step of the flow sits on the midnight desk: the landing page, the
  // wait, the results and a failure.
  return (
    <div className="surface-midnight flex flex-1 flex-col">
      <SiteHeader
        onStartOver={screen === "landing" ? undefined : reset}
        showDemoTag={mode === "mock"}
        wide={state.phase === "done"}
        surface="midnight"
      />

      <main className="flex-1">
        {screen === "landing" && (
          <Landing
            onAnalyze={handleAnalyze}
            mode={mode}
            // Only on coming back to it: a landing kept up while a sample
            // opens must not jump to its top.
            returning={hasStarted && state.phase === "idle"}
          />
        )}

        {screen === "processing" && state.phase === "processing" && (
          <ProcessingView
            fileName={sourceLabel(state.source)}
            stage={state.stage}
            prepared={isSample}
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
              isCannedUpload ? (
                <>
                  <strong>Demo build: this is sample data.</strong> Analysis
                  isn&rsquo;t connected yet, so the answers below describe one
                  of our sample letters, not the file you uploaded.
                </>
              ) : (
                isSample && (
                  <>
                    <strong>Sample result, prepared in advance.</strong> This
                    letter is made up, and these answers were prepared ahead of
                    time, not produced by a live analysis. No AI call was made.
                    To see a live analysis, start over and upload a PDF.
                  </>
                )
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
    </div>
  );
}
