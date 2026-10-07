// owner: r
// Runs every letter in eval/letters through analyze() and scores it against eval/answer-key.csv.
// From repo root:  npx tsx eval/run-eval.ts            (all letters)
//                  npx tsx eval/run-eval.ts L04 L07    (just those)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyze } from "../lib/explain";
import type { AnalysisResult } from "../lib/schema";

// tsx doesn't load .env like Next does. explain.ts reads env lazily, so loading here is early enough.
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

type Status = "verified" | "unsure" | "not_found";
type Row = Record<string, string>;
type Verdict = "pass" | "review" | "underclaim" | "overclaim" | "hallucination" | "wrong_value";

const RANK: Record<Status, number> = { not_found: 0, unsure: 1, verified: 2 };

interface Spec {
  name: keyof AnalysisResult["fields"];
  label: string;
  status: string; // answer-key column with the expected status
  norm?: string; // column with expected normalized value(s), "a | b"
  evidence?: string; // column with expected evidence quotes, "a || b"
}

const SPECS: Spec[] = [
  { name: "amountOwed", label: "amount", status: "amount_expected_status", norm: "amount_expected_normalized" },
  { name: "deadline", label: "deadline", status: "deadline_expected_status", norm: "deadline_expected_normalized" },
  { name: "requiredAction", label: "action", status: "required_action_expected_status", evidence: "required_action_evidence_quotes" },
  { name: "consequence", label: "conseq", status: "consequence_expected_status", evidence: "consequence_evidence_quotes" },
];

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

// Ignore all whitespace and quote style, since line wraps drop or add spaces.
const squash = (s: string) =>
  s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, "");
const num = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

type FieldOut = AnalysisResult["fields"][keyof AnalysisResult["fields"]];

function grade(spec: Spec, row: Row, f: FieldOut): { verdict: Verdict; why: string } {
  const exp = (row[spec.status] || "not_found") as Status;
  const act = f.status as Status;

  if (act === "verified" && RANK[act] > RANK[exp]) {
    return exp === "not_found"
      ? { verdict: "hallucination", why: "letter doesn't state this, but we reported it as verified" }
      : { verdict: "overclaim", why: "key says this is unclear or conflicting, but we reported it as verified" };
  }
  if (act === "unsure" && exp === "not_found") {
    return { verdict: "review", why: "letter doesn't state this; we gave a value but flagged it unsure" };
  }
  if (RANK[act] < RANK[exp]) {
    return { verdict: "underclaim", why: `expected ${exp}, we said ${act} (safe, but lossy)` };
  }

  if (act === "verified") {
    const expNorm = spec.norm ? (row[spec.norm] || "").split("|").map((s) => s.trim()).filter(Boolean) : [];
    if (expNorm.length) {
      if (!f.normalized) return { verdict: "review", why: "verified but no normalized value to compare" };
      const ok = spec.name === "amountOwed"
        ? expNorm.some((e) => num(e) === num(f.normalized!))
        : expNorm.includes(f.normalized);
      if (!ok) return { verdict: "wrong_value", why: `expected ${expNorm.join(" or ")}, got ${f.normalized}` };
    } else if (spec.evidence) {
      const exps = (row[spec.evidence] || "").split("||").map((s) => squash(s)).filter(Boolean);
      const a = squash(f.citation?.quote ?? "");
      const ok = a && exps.some((e) => a.includes(e) || e.includes(a));
      if (!ok) return { verdict: "review", why: "cited text differs from the key's evidence; check the wording by hand" };
    }
  }
  return { verdict: "pass", why: "" };
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

const MARK: Record<Verdict, string> = {
  pass: "✓", review: "~", underclaim: "↓", overclaim: "✗", hallucination: "✗", wrong_value: "✗",
};

async function main() {
  const [header, ...body] = parseCsv(readFileSync(join(process.cwd(), "eval/answer-key.csv"), "utf8"));
  const rows: Row[] = body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
  const only = process.argv.slice(2).map((s) => s.toUpperCase());
  const selected = only.length ? rows.filter((r) => only.includes(r.letter_id)) : rows;
  if (!selected.length) { console.log("No matching letters."); return; }

  console.log(`Running ${selected.length} letters with ${process.env.LLM_MODEL ?? "(LLM_MODEL not set)"} ...\n`);

  const runs = await pool(selected, 3, async (row) => {
    try {
      const text = readFileSync(join(process.cwd(), "eval/letters", row.file), "utf8");
      return { row, result: (await analyze(text)) as AnalysisResult, error: null as string | null };
    } catch (e) {
      return { row, result: null as AnalysisResult | null, error: e instanceof Error ? e.message : String(e) };
    }
  });

  const tally: Record<Verdict, number> = { pass: 0, review: 0, underclaim: 0, overclaim: 0, hallucination: 0, wrong_value: 0 };
  let cost = 0, inTok = 0, outTok = 0, errors = 0;
  const latencies: number[] = [];

  for (const { row, result, error } of runs) {
    console.log(`${row.letter_id}  ${row.scenario}`);
    if (!result) { errors++; console.log(`  ERROR: ${error}\n`); continue; }
    cost += result.metrics.costUsd; inTok += result.metrics.inputTokens; outTok += result.metrics.outputTokens;
    latencies.push(result.metrics.latencyMs);

    for (const spec of SPECS) {
      const f = result.fields[spec.name];
      const g = grade(spec, row, f);
      tally[g.verdict]++;
      const exp = row[spec.status] || "not_found";
      console.log(`  ${spec.label.padEnd(9)} ${MARK[g.verdict]} ${g.verdict.padEnd(13)} exp ${exp.padEnd(10)} got ${f.status.padEnd(10)} ${f.value ? JSON.stringify(f.value.slice(0, 60)) : ""}`);
      if (g.verdict !== "pass") {
        console.log(`      why: ${g.why}`);
        if (f.note) console.log(`      model note: ${f.note.slice(0, 140)}`);
      }
    }
    console.log("");
  }

  const total = SPECS.length * (runs.length - errors);
  const danger = tally.hallucination + tally.overclaim + tally.wrong_value;
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  console.log("=".repeat(60));
  console.log(`Fields: ${tally.pass}/${total} pass | ${tally.review} review | ${tally.underclaim} underclaim (safe) | ${danger} DANGEROUS`);
  console.log(`  hallucinations (invented, shown verified): ${tally.hallucination}`);
  console.log(`  overclaims (unclear in letter, shown verified): ${tally.overclaim}`);
  console.log(`  wrong values (verified, wrong amount/date): ${tally.wrong_value}`);
  if (errors) console.log(`  letters that errored: ${errors}`);
  console.log(`Cost $${cost.toFixed(4)} | tokens in ${inTok} out ${outTok} | latency avg ${avg}ms max ${Math.max(0, ...latencies)}ms`);
  console.log("Wrong-but-verified must be 0 for the pitch to hold.");

  writeFileSync("/tmp/unsealed-eval.json", JSON.stringify(runs, null, 2));
  console.log("Full outputs: /tmp/unsealed-eval.json");
  if (danger > 0 || errors > 0) process.exitCode = 1;
}

main();
