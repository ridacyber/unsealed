// owner: r
// Blind holdout runner: runs every letter in eval/letters/holdout through analyze()
// and writes results for m to score. Reads NO answer key. Each run writes new timestamped files.
// From repo root:  npx tsx scripts/run-holdout.ts
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyze } from "../lib/explain";
import type { AnalysisResult } from "../lib/schema";

(function loadEnv() {
  const p = join(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
})();

const DIR = join(process.cwd(), "eval/letters/holdout");
const FIELDS = ["amountOwed", "deadline", "requiredAction", "consequence"] as const;
const SHORT: Record<(typeof FIELDS)[number], string> = {
  amountOwed: "amount", deadline: "deadline", requiredAction: "action", consequence: "conseq",
};

function sh(cmd: string): string {
  try { return execSync(cmd, { encoding: "utf8" }).trim(); } catch { return "unknown"; }
}
const csvCell = (s: string) => `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

async function main() {
  if (!existsSync(DIR)) { console.log("No eval/letters/holdout folder. Run git pull first."); return; }
  const files = readdirSync(DIR).filter((f) => f.endsWith(".txt")).sort();
  if (!files.length) { console.log("No .txt letters found in the holdout folder."); return; }

  const commit = sh("git rev-parse --short HEAD");
  const dirty = sh("git status --porcelain lib");
  const model = process.env.LLM_MODEL ?? "(LLM_MODEL not set)";
  console.log(`Holdout run: ${files.length} letters | model ${model} | commit ${commit}`);
  if (dirty && dirty !== "unknown") {
    console.log("WARNING: lib/ has uncommitted changes, so these results don't match any commit:\n" + dirty);
  }
  console.log("");

  const runs = await pool(files, 3, async (file) => {
    try {
      const text = readFileSync(join(DIR, file), "utf8");
      return { file, result: (await analyze(text)) as AnalysisResult, error: null as string | null };
    } catch (e) {
      return { file, result: null as AnalysisResult | null, error: e instanceof Error ? e.message : String(e) };
    }
  });

  const header = ["letter_id", "file", "overall"];
  for (const f of FIELDS) header.push(`${SHORT[f]}_status`, `${SHORT[f]}_value`, `${SHORT[f]}_quote`);
  header.push("latency_ms", "error");
  const csv: string[] = [header.join(",")];

  let cost = 0, errors = 0;
  const lat: number[] = [];

  for (const { file, result, error } of runs) {
    const id = file.split("-")[0];
    console.log(id + "  " + file);
    const row: string[] = [csvCell(id), csvCell(file)];
    if (!result) {
      errors++;
      console.log("  ERROR: " + error + "\n");
      row.push(csvCell("error"));
      for (let i = 0; i < FIELDS.length * 3; i++) row.push(csvCell(""));
      row.push(csvCell(""), csvCell(error ?? ""));
      csv.push(row.join(","));
      continue;
    }
    cost += result.metrics.costUsd;
    lat.push(result.metrics.latencyMs);
    row.push(csvCell(result.overall));
    for (const name of FIELDS) {
      const f = result.fields[name];
      console.log(`  ${SHORT[name].padEnd(9)} ${f.status.padEnd(10)} ${f.value ? JSON.stringify(f.value.slice(0, 70)) : ""}`);
      row.push(csvCell(f.status), csvCell(f.value ?? ""), csvCell(f.citation?.quote ?? ""));
    }
    row.push(csvCell(String(result.metrics.latencyMs)), csvCell(""));
    csv.push(row.join(","));
    console.log("");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const csvPath = `/tmp/unsealed-holdout-${stamp}.csv`;
  const jsonPath = `/tmp/unsealed-holdout-${stamp}.json`;
  writeFileSync(csvPath, csv.join("\n") + "\n");
  writeFileSync(jsonPath, JSON.stringify({ commit, model, runs }, null, 2));

  const avg = lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : 0;
  console.log("=".repeat(60));
  console.log(`Letters ${files.length} | errors ${errors} | cost $${cost.toFixed(4)} | latency avg ${avg}ms max ${Math.max(0, ...lat)}ms`);
  console.log("Results for m to score: " + csvPath);
  console.log("Full outputs: " + jsonPath);
  console.log("Run this once per prompt version. Don't tune against these letters.");
}

main();
