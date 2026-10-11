// owner: r
// Offset regression check: every field citation and warning quote must point at the same text
// inside the returned documentText (ignoring whitespace and case, like verify.ts does).
// From repo root:  npx tsx scripts/check-offsets.ts [folder] [filename-filter]
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileToText } from "../lib/extract";
import { analyze } from "../lib/explain";

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

const DIR = join(process.cwd(), process.argv[2] ?? "eval/letters");
const FILTER = process.argv[3] ?? "";

const norm = (s: string) =>
  s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, "").toLowerCase();

type Cite = { quote: string; start: number; end: number };

async function main() {
  const files = readdirSync(DIR).filter((f) => /\.(pdf|txt)$/i.test(f) && f.includes(FILTER)).sort();
  if (files.length === 0) { console.error("No PDFs found in " + DIR + " matching '" + FILTER + "'"); process.exit(1); }

  let checked = 0, skipped = 0, warnings = 0, errors = 0;
  const failures: string[] = [];

  for (const f of files) {
    try {
      const buf = readFileSync(join(DIR, f));
      const text = f.toLowerCase().endsWith(".txt")
        ? buf.toString("utf8")
        : await fileToText(new File([buf], f, { type: "application/pdf" }));
      const result = await analyze(text);
      const doc = result.documentText;
      const check = (label: string, c: Cite | null) => {
        if (!c) return;
        if (c.start < 0 || c.end < 0) { skipped++; return; } // quote was not located; nothing to check
        checked++;
        const ok = c.start < c.end && c.end <= doc.length && norm(doc.slice(c.start, c.end)) === norm(c.quote);
        if (!ok) failures.push(f + " " + label + " [" + c.start + "-" + c.end + "] quote: " + c.quote.slice(0, 60) + " | text: " + doc.slice(Math.max(0, c.start), Math.max(0, c.end)).slice(0, 60));
      };
      for (const [name, field] of Object.entries(result.fields)) check(name, field.citation);
      (result.warnings ?? []).forEach((w, i) => { warnings++; check("warning" + i + "A", w.quotes[0]); check("warning" + i + "B", w.quotes[1]); });
      console.log(f + "  done");
    } catch (err) {
      errors++;
      console.log(f + "  ERROR: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  console.log("\nLetters: " + files.length + " | citations checked: " + checked + " | not located (skipped): " + skipped + " | warnings seen: " + warnings + " | errors: " + errors);
  if (failures.length) { console.log("OFFSET FAILURES (" + failures.length + "):\n" + failures.join("\n")); process.exit(1); }
  console.log("All checked offsets match the returned documentText.");
}

main();
