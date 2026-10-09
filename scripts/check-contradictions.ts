// owner: r
// Runs the contradiction check on the dev letters and scores it against the answer key.
// From repo root:  npx tsx scripts/check-contradictions.ts            (all)
//                  npx tsx scripts/check-contradictions.ts L04 L15     (just those)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findContradictions, type CheckResult } from "../lib/contradictions";

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

type Row = Record<string, string>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = ""; rows.push(row); row = [];
    } else cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

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
  const [header, ...body] = parseCsv(readFileSync(join(process.cwd(), "eval/answer-key.csv"), "utf8"));
  const rows: Row[] = body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
  const only = process.argv.slice(2).map((s) => s.toUpperCase());
  const selected = only.length ? rows.filter((r) => only.includes(r.letter_id)) : rows;
  if (!selected.length) { console.log("No matching letters."); return; }

  console.log(`Contradiction check: ${selected.length} letters | model ${process.env.LLM_MODEL ?? "(not set)"}\n`);

  const runs = await pool(selected, 3, async (row) => {
    try {
      const text = readFileSync(join(process.cwd(), "eval/letters", row.file), "utf8");
      return { row, res: await findContradictions(text), error: null as string | null };
    } catch (e) {
      return { row, res: null as CheckResult | null, error: e instanceof Error ? e.message : String(e) };
    }
  });

  let hits = 0, expectedCount = 0, falseAlarms = 0, errors = 0, inTok = 0, outTok = 0;
  const missed: string[] = [];
  const falseIds: string[] = [];
  const lat: number[] = [];

  for (const { row, res, error } of runs) {
    const expected = row.scenario.toLowerCase().includes("conflicting");
    if (!res) { errors++; console.log(`${row.letter_id}  ERROR: ${error}\n`); continue; }
    const fired = res.contradictions.length > 0;
    inTok += res.inputTokens; outTok += res.outputTokens; lat.push(res.latencyMs);
    if (expected) expectedCount++;
    let mark = "✓";
    if (expected && fired) hits++;
    else if (expected && !fired) { mark = "· missed"; missed.push(row.letter_id); }
    else if (!expected && fired) { mark = "✗ FALSE ALARM"; falseAlarms++; falseIds.push(row.letter_id); }

    console.log(`${row.letter_id}  ${row.scenario}`);
    console.log(`   expect ${expected ? "WARNING" : "none   "}  got ${fired ? "WARNING" : "none   "}  ${mark}`);
    for (const c of res.contradictions) {
      console.log(`   [${c.topic}] ${c.message}`);
      console.log(`     A (${c.quotes[0].start}-${c.quotes[0].end}): ${JSON.stringify(c.quotes[0].quote)}`);
      console.log(`     B (${c.quotes[1].start}-${c.quotes[1].end}): ${JSON.stringify(c.quotes[1].quote)}`);
    }
    for (const d of res.dropped) console.log(`   dropped: ${d}`);
    console.log("");
  }

  const inRate = Number(process.env.LLM_INPUT_USD_PER_M ?? 0);
  const outRate = Number(process.env.LLM_OUTPUT_USD_PER_M ?? 0);
  const cost = (inTok * inRate + outTok * outRate) / 1_000_000;
  const avg = lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : 0;

  console.log("=".repeat(60));
  console.log(`Caught ${hits}/${expectedCount} letters that contradict themselves${missed.length ? " (missed: " + missed.join(", ") + ")" : ""}`);
  console.log(`False alarms on other letters: ${falseAlarms}${falseIds.length ? " (" + falseIds.join(", ") + ")" : ""}`);
  if (errors) console.log(`Letters that errored: ${errors}`);
  console.log(`Cost $${cost.toFixed(4)} | tokens in ${inTok} out ${outTok} | latency avg ${avg}ms max ${Math.max(0, ...lat)}ms`);

  writeFileSync("/tmp/unsealed-contradictions.json", JSON.stringify(runs, null, 2));
  console.log("Full outputs: /tmp/unsealed-contradictions.json");
  if (falseAlarms > 0 || errors > 0) process.exitCode = 1;
}

main();
