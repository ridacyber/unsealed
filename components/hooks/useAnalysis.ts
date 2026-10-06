// owner: m
"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { AnalysisClient, ProcessingStage } from "@/components/lib/client";
import {
  toErrorCode,
  toErrorDetail,
  type AnalysisErrorCode,
} from "@/components/lib/errors";
import { httpClient } from "@/components/lib/httpClient";
import { analyzeSample, mockClient } from "@/components/lib/mockClient";
import { getSample, type SampleId } from "@/components/lib/samples";
import type { AnalysisResult } from "@/lib/schema";

/**
 * The one switch between canned results and the real service. Set to true
 * once POST /api/analyze exists; nothing else in the UI needs to change.
 */
const USE_LIVE_API = false;

const defaultClient: AnalysisClient = USE_LIVE_API ? httpClient : mockClient;

/** What is being analyzed: the person's own file, or one of our samples. */
export type AnalysisSource =
  { kind: "upload"; file: File } | { kind: "sample"; id: SampleId };

/** A name for the source that can be shown to the person. */
export function sourceLabel(source: AnalysisSource): string {
  return source.kind === "upload"
    ? source.file.name
    : getSample(source.id).title;
}

export type AnalysisState =
  | { phase: "idle" }
  | {
      phase: "processing";
      source: AnalysisSource;
      stage: ProcessingStage | null;
    }
  | { phase: "done"; source: AnalysisSource; result: AnalysisResult }
  | {
      phase: "failed";
      source: AnalysisSource;
      code: AnalysisErrorCode;
      detail: string | null;
    };

export type AnalysisAction =
  | { type: "started"; source: AnalysisSource }
  | { type: "stage_changed"; stage: ProcessingStage }
  | { type: "succeeded"; result: AnalysisResult }
  | { type: "failed"; code: AnalysisErrorCode; detail: string | null }
  | { type: "reset" };

export function analysisReducer(
  state: AnalysisState,
  action: AnalysisAction,
): AnalysisState {
  switch (action.type) {
    case "started":
      return { phase: "processing", source: action.source, stage: null };
    case "reset":
      return { phase: "idle" };
  }

  // The remaining actions only make sense while an analysis is running.
  if (state.phase !== "processing") return state;
  const { source } = state;

  switch (action.type) {
    case "stage_changed":
      return { ...state, stage: action.stage };
    case "succeeded":
      return { phase: "done", source, result: action.result };
    case "failed":
      return {
        phase: "failed",
        source,
        code: action.code,
        detail: action.detail,
      };
  }
}

export function useAnalysis(client: AnalysisClient = defaultClient) {
  const [state, dispatch] = useReducer(analysisReducer, { phase: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const start = useCallback(
    (source: AnalysisSource) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const isCurrent = () => !controller.signal.aborted;

      const options = {
        signal: controller.signal,
        onStage: (stage: ProcessingStage) => {
          if (isCurrent()) dispatch({ type: "stage_changed", stage });
        },
      };

      dispatch({ type: "started", source });
      const analysis =
        source.kind === "sample"
          ? analyzeSample(source.id, options)
          : client.analyze(source.file, options);

      analysis
        .then((result) => {
          if (isCurrent()) dispatch({ type: "succeeded", result });
        })
        .catch((error: unknown) => {
          if (isCurrent()) {
            dispatch({
              type: "failed",
              code: toErrorCode(error),
              detail: toErrorDetail(error),
            });
          }
        });
    },
    [client],
  );

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch({ type: "reset" });
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { state, start, reset, mode: client.mode };
}
