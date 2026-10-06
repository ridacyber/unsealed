// owner: m
import { mockNotFound, mockResult } from "@/lib/mock";
import type { AnalysisResult } from "@/lib/schema";
import {
  PROCESSING_STAGES,
  type AnalysisClient,
  type AnalyzeOptions,
} from "./client";
import { AnalysisError, type AnalysisErrorCode } from "./errors";
import { getSample, type SampleId } from "./samples";

/** How long each processing stage appears to take. */
const DEFAULT_STAGE_DELAY_MS = 1100;

/**
 * A word in the file name picks the canned result, so the not-found state can
 * be demonstrated with any file (for example "my-letter-missing.pdf").
 */
const NOT_FOUND_HINT = /missing|not[-_ ]?found/i;

/** File-name words that make the mock fail, to demonstrate the error states. */
const FAILURE_HINTS: ReadonlyArray<[pattern: RegExp, code: AnalysisErrorCode]> =
  [
    [/unreadable|blank/i, "unreadable"],
    [/offline/i, "upload_failed"],
    [/fail|broken/i, "processing_failed"],
  ];

export function failureForFile(fileName: string): AnalysisErrorCode | null {
  return FAILURE_HINTS.find(([pattern]) => pattern.test(fileName))?.[1] ?? null;
}

export function resultForFile(fileName: string): AnalysisResult {
  return NOT_FOUND_HINT.test(fileName) ? mockNotFound : mockResult;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function runStages(
  { signal, onStage }: AnalyzeOptions,
  stageDelayMs: number,
  failure: AnalysisErrorCode | null,
): Promise<void> {
  if (failure === "upload_failed") {
    await wait(stageDelayMs, signal);
    throw new AnalysisError("upload_failed");
  }

  for (const stage of PROCESSING_STAGES) {
    onStage?.(stage);
    await wait(stageDelayMs, signal);
    if (failure === "unreadable" && stage === "reading") {
      throw new AnalysisError("unreadable");
    }
    if (failure === "processing_failed" && stage === "verifying") {
      throw new AnalysisError("processing_failed");
    }
  }
}

interface MockClientOptions {
  stageDelayMs?: number;
}

export function createMockClient({
  stageDelayMs = DEFAULT_STAGE_DELAY_MS,
}: MockClientOptions = {}): AnalysisClient {
  return {
    mode: "mock",

    async analyze(file, options = {}) {
      await runStages(options, stageDelayMs, failureForFile(file.name));
      return resultForFile(file.name);
    },
  };
}

export const mockClient = createMockClient();

/** Samples are canned in every mode: there is no file behind them to send. */
export async function analyzeSample(
  id: SampleId,
  options: AnalyzeOptions = {},
  stageDelayMs = DEFAULT_STAGE_DELAY_MS,
): Promise<AnalysisResult> {
  await runStages(options, stageDelayMs, null);
  return getSample(id).result;
}
