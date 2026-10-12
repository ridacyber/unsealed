import { NextResponse } from "next/server";
import { analyze, ExplainError } from "../../../lib/explain";
import { fileToText } from "../../../lib/extract";
import { AnalyzeResponseSchema, type AnalyzeResponse } from "../../../lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

function reply(body: AnalyzeResponse, status = 200) {
  return NextResponse.json(AnalyzeResponseSchema.parse(body), { status });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return reply({ ok: false, error: "No file was uploaded." }, 400);
    }

    const text = await fileToText(file);
    const result = await analyze(text);
    return reply({ ok: true, result });
  } catch (err) {
    if (err instanceof ExplainError && !err.internal) {
      return reply({ ok: false, error: err.message }, 422);
    }
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      console.error("analyze timed out:", err.name);
      return reply({ ok: false, error: "That took longer than expected. Please try again in a moment." }, 500);
    }
    // Never log the letter's contents. Internal messages are ours (status codes, config names) and never sent to the user.
    console.error("analyze failed:", err instanceof ExplainError ? err.message : err instanceof Error ? err.name : "unknown");
    return reply({ ok: false, error: "Something went wrong on our side. Please try again." }, 500);
  }
}