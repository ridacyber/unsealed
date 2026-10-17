# Blind C run 1: run notes

Run: 2026-10-17, started shortly before 17:30:09 UTC (output filename timestamp).
Run commit: 5bf355a7dec95723bc63fe55336a329847f70e35, from a detached checkout with a clean working tree.
Letters: C01 to C08, hashes verified OK against SHA256SUMS.txt before the run.
Command: npx tsx scripts/run-holdout.ts ../c-run C 2>&1 | tee console.txt
Outcome: 8 letters, 0 errors, contradiction check ok on all 8. One run only, no reruns.

Deviations from PREREGISTRATION.md, disclosed:
1. Folder: the eight letter files were copied unchanged to ../c-run (outside the repo) and the runner pointed there instead of eval/letters/blind-c. The prefix argument C was passed as written.
2. History rewrite: on 2026-10-17 a commit re-author and force push rewrote branch history, so 5bf355a is no longer an ancestor of origin/main. It is preserved by the tag blind-c-freeze. Before the rewrite, git diff --stat 5bf355a HEAD over lib, app/api, scripts, eval/run-eval.ts and package.json was empty.
3. Later backend change: commit 83c8d04 (a contradiction-check failure now reports checkStatus failed instead of ok) is on main but was NOT part of this run. It is a post-run change.
4. The L04 dev letter was used on 2026-10-17 to test that change. No C letter went through anything before this run.
