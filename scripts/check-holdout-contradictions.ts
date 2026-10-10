// owner: r
// Blind check: runs the contradiction check on the holdout letters and prints ONLY which letters fire.
// No quotes or messages are printed. Full results go to a file for m to score.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findContradictions } from "../lib/contradictions";

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

function sh(cmd: string): string {
  try { return execSync(cmd, { encoding: "utf8" }).trim(); } catch { return "unknown"; }
}

async function main() {
  const dir = join(process.cwd(), process.argv[2] ?? "eval/letters/holdout");
  if (!existsSync(dir)) { console.log("No holdout folder. Run git pull first."); return; }
  const files = readdirSync(dir).filter((f) => f.endsWith(".txt")).sort();
  const commit = sh("git rev-parse --short HEAD");
  console.log(`Holdout contradiction check: ${files.length} letters | commit ${commit} | prints only which letters fire\n`);

  const results: unknown[] = [];
  let fired = 0, errors = 0;
  for (const f of files) {
    const id = f.split("-")[0];
    try {
      const res = await findContradictions(readFileSync(join(dir, f), "utf8"));
      results.push({ file: f, ...res });
      const n = res.contradictions.length;
      if (n > 0) fired++;
      console.log(`${id}  ${n > 0 ? "WARNING x" + n : "none"}`);
    } catch (e) {
      errors++;
      results.push({ file: f, error: e instanceof Error ? e.message : String(e) });
      console.log(`${id}  ERROR`);
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `/tmp/unsealed-holdout-contradictions-${stamp}.json`;
  writeFileSync(path, JSON.stringify({ commit, results }, null, 2));
  console.log(`\nFired on ${fired} of ${files.length}${errors ? ` | errors ${errors}` : ""}`);
  console.log(`Results for m to score: ${path}`);
  console.log("Run this once per version. Don't open the file or tune against it.");
}

main();
