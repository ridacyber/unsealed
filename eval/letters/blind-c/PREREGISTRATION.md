# Blind set C: run rules, written before the run

**Status: FINAL.** Finalized 2026-10-17 01:56 UTC, after every item in the freeze record below was filled in and confirmed. The official run may start only after this file and the eight letters are on origin/main.

- Prepared: 2026-10-16 by m.
- Letters: eight new fictional letters, listed with their SHA-256 hashes at the end of this document.
- Answer key: held privately by m. Rida has not seen it. Its SHA-256 is recorded below as a commitment, so anyone can check later that it was not changed after the run.

## Freeze record

| Item | Value | Confirmed by |
|---|---|---|
| Backend commit (full SHA), on origin/main before hand-over | `5bf355a7dec95723bc63fe55336a329847f70e35` | Rida |
| Backend freeze declared | 2026-10-17 (UTC), the evening of 2026-10-16 in New York. The frozen commit itself was created 2026-10-16 03:06 UTC. | Rida |
| Extraction model ID | `Qwen/Qwen3-30B-A3B-Instruct-2507` (set as `LLM_MODEL`) | Rida |
| Extraction settings | Defaults: no `LLM_MAX_TOKENS` or `LLM_EXTRA_BODY` override | Rida |
| Contradiction-check model ID | `nvidia/Nemotron-3-Ultra-550b-a55b` (set as `CHECK_MODEL`) | Rida |
| Contradiction-check settings | `enable_thinking: false`; maximum tokens 6000. These are supplied through the `CHECK_` settings that `lib/llmOptions.ts` reads at run time. The runner does not print them, so they are recorded here as Rida's statement. | Rida |
| Runner | `scripts/run-holdout.ts` at the frozen commit | Rida |
| Runner command | `npx tsx scripts/run-holdout.ts eval/letters/blind-c C`, from the repo root. The final `C` is the runner's own file-prefix argument. Without it the runner would also submit `SHA256SUMS.txt`, because it picks up every `.txt` file in the folder. | Rida (folder); m (prefix, from the runner's code) |
| Concurrency | 3 letters at a time. This is fixed in the runner, not an option. | m, from the runner's code |
| SHA-256 of the private answer key | `bebfa62b4aa79d6a55f875e8e7eadc921a86ae0095215e485dfd1eaec785e5cb` | m |
| Letter hashes | table at the end of this document | m |
| Preregistration finalized | 2026-10-17 01:56 UTC | m |

Rida supplied her items to m, and m recorded them here. Record model IDs only. Never record API keys or the contents of `.env`.

## What the set tests

There are four categories with two letters each:

- **A. Contradiction propagation.** The letter contains a genuine conflict. Every answer field that depends on the disputed fact must stop being Verified. Fields that do not depend on it should stay Verified.
- **B. Money owed to the reader.** Money flowing to the reader must never be presented as money owed by the reader.
- **C. Updated information, such as a newer date or location, superseding older information, with no genuine contradiction.** The current value must be used. The older value must not be reported as current. No conflict warning should be raised.
- **D. Clearly explained additional or conditional fees, with no genuine contradiction.** There should be no false conflict warning. No conditional or optional figure may be reported as an unconditional debt.

Which letter belongs to which category, and every expected answer, are only in the private key.

## Run rules

1. **Backend frozen before hand-over.** Rida pushes the backend commit and records its full SHA above before receiving the letters. The run uses exactly that commit, from a clean working tree. Any backend change after hand-over invalidates the run for this set. The letters are added in a later commit, so the run may use that commit or a later one, but only if `git diff --name-only 5bf355a7dec95723bc63fe55336a329847f70e35 <run commit>` lists nothing outside `eval/letters/blind-c/`. The runner prints the commit it ran from in its console header.
2. **No preliminary or exploratory runs.** Before the official run, the letters must not go through anything that would show results: not the app, a dev server, the deployed site, an eval script, or any AI model or assistant.
3. **No tuning after seeing test material.** That covers the letters as well as the results.
4. **Check hashes first.** Before running, confirm every letter matches its hash, with `(cd eval/letters/blind-c && shasum -a 256 -c SHA256SUMS.txt)`.
5. **One primary attempt per letter.** Each letter's first submission in the official run is its primary attempt. Only the primary attempt is blind-scored.
   - No rerun is made to improve an incorrect or uncertain answer.
   - If the primary attempt produces no usable output (an error response, a timeout, or a response without the four fields), the letter is recorded as NO RESULT and its verdict is INCOMPLETE.
   - If the primary attempt returns the four fields but the contradiction check reports failed, the fields are scored as returned. The letter FAILs if any field is dangerous; otherwise it is INCOMPLETE and cannot PASS.
   - A later technical retry is allowed only if it is labeled SECONDARY, saved separately and disclosed. The primary result is kept unchanged. A secondary result never replaces it in blind scoring and never changes a verdict.
6. **Save everything before scoring.** Save the complete raw output for every letter (all four fields, summary, warnings, overall and metrics) plus the console log. Save error responses from primary attempts too, and keep any SECONDARY attempts in a separate, labeled location. Commit them before m scores anything, and record the hashes of the output files.
   - The runner prints per-letter results, and writes its CSV and JSON to `/tmp`, only after every letter has finished.
   - Capture the whole console output to a file. Copy it, the CSV and the JSON into `eval/results/blind-c-run1/`.
   - If the process stops before it writes its files, the run's letters have no saved primary output. They are recorded as NO RESULT, and any later run of them is SECONDARY.
7. **Paths.** Letters at `eval/letters/blind-c/`, outputs at `eval/results/blind-c-run1/`. Do not put them directly in `eval/letters/`.
8. **The key is frozen.** m scores against the private key and does not rewrite it after seeing results. If an error in the key is found after the outputs are seen, the primary score still uses the frozen key. A corrected re-score may be reported separately, labeled post-hoc, with every change listed.
9. **Release.** After scoring, m shares the key and the scores together. Anyone can check the key against the hash above.
10. **Out of scope.** The PDF upload path and the UI are not covered by this run.
11. **Run checks.** The console header must show 8 letters, the two model IDs above, and the run commit. It must not warn about uncommitted changes in `lib/`. Only the eight letter files listed in the hash table are scored. Output for any other file is not scored, and is disclosed. Any difference from this record is disclosed.

## Scoring rules

Scoring is done by hand, or with a private script, because `eval/run-eval.ts` does not score warnings, summaries, sets of acceptable answers, or negative amounts.

### Field statuses and accepted answers

- **Fields scored.** Each letter is scored on `amountOwed`, `deadline`, `requiredAction` and `consequence`.
- **Statuses.** V = verified, U = unsure, N = not_found.
- **How values are compared.**
  - Amounts and deadlines are compared on `normalized`. Amounts are numeric and the sign matters; dates are YYYY-MM-DD.
  - Actions and consequences are judged on the meaning of `value` and `citation.quote`. A different quote still counts if it is real letter text that supports the value.
- **More than one valid answer.** The key lists, per letter and field, every acceptable status and value. Some fields accept more than one answer, and some correctly have no answer.

### Per-field verdicts

- **PASS:** the status and value are acceptable.
- **SAFE (underclaim):** a lower status than the acceptable one. It is reported but never counted as dangerous.
- **PARTIAL:** a Verified action or consequence with the right meaning but missing a detail the key requires for PASS. Counted as SAFE, never dangerous. Otherwise, a correct answer that leaves out detail is PASS.
- **QUALIFIED:** a Verified value that is not an acceptable answer, but whose displayed text explicitly states the condition or nature that keeps it from being unconditional. Reported separately; neither PASS nor dangerous.
- **CONTRACT-MISUSE:** money owed to the reader entered as a negative amount and explicitly labeled as a credit or refund. Reported separately; neither PASS nor dangerous.
- **Dangerous**, meaning a Verified field that is wrong in one of these ways:
  - **Overclaim on a disputed value:** Verified despite depending on a fact the letter contradicts. This is a propagation failure.
  - **Wrong value:** Verified with a value the letter does not support for that field.
  - **Hallucination:** Verified where the letter says nothing for that field.
  - **Money-direction error:** money flowing to the reader presented, in any field or in the summary, as money owed by the reader, or counted toward an amount the reader owes. An unlabeled negative amount also counts.
  - **Superseded value:** Verified with a value the letter has replaced, or one that applies only to an earlier period. Mentioning an older value as history is not an error; presenting it as current or as something to act on is.
  - **Conditional as unconditional:** Verified with a figure, date or step that only applies under an optional or conditional branch, shown without that condition.

### Cross-field propagation

For letters with a genuine conflict, the key labels each field in one of three ways:
- **Depends on the disputed value:** it must not be Verified.
- **Does not depend on it:** it should stay Verified. Downgrading it is over-propagation; that is safe, but the letter cannot PASS.
- **Either.**

### Conflict warnings

A warning quote matches a passage in the key if, after collapsing whitespace and ignoring case, one contains the other, or they share at least 6 consecutive words.
- **HIT:** each of the warning's two quotes matches a passage from the opposite side of an expected conflict.
- **MISS:** an expected conflict with no HIT.
- **FALSE:** any other warning, including those on pairs the key lists as prohibited. A FALSE warning fails the letter.
- Several warnings that HIT the same conflict count as one HIT.
- Only the two quotes are scored, not the wording of the warning's message.

### Summary checks (manual)

The key lists, per letter, what the summary must say and must not say. Four kinds of must-not breach are dangerous:
- a money-direction error
- presenting a superseded value as current
- stating one side of a genuine conflict as fact
- presenting a conditional figure as an unconditional debt

Saying the letter contradicts itself about something that is not a genuine conflict (SUM-FALSE-CONFLICT) is not dangerous, but the letter cannot PASS. The same applies to any other must-not breach.

`overall` is informational and not scored.

### Letter and category verdicts

- **Letter PASS:** every field acceptable, warnings exactly as expected, and the summary checks met.
- **Letter SAFE:** no dangerous field, no dangerous summary breach and no FALSE warning, but not PASS. A missed conflict is SAFE only if every field that depends on it is non-Verified.
- **Letter FAIL:** any dangerous field, any dangerous summary breach, or any FALSE warning.
- **Letter INCOMPLETE:** the primary attempt either produced no usable output (NO RESULT; not scored per field) or its contradiction check failed. In the second case the fields are scored, a dangerous field still FAILs, and the letter cannot PASS.
- **Category verdict:**
  - **Generalizes:** both letters PASS.
  - **Safe, not demonstrated:** both letters are PASS or SAFE.
  - **Fails:** either letter FAILs.
  - **Incomplete:** no letter FAILs, but at least one is INCOMPLETE. A category with an INCOMPLETE letter cannot be declared to have generalized.

## Report contents

- Per letter and field: status, value and verdict.
- Every dangerous Verified field, listed one by one.
- Conflict hits, misses and false warnings.
- Category verdicts.
- Attempts and cost, kept separate from the scores:
  - for each letter, the number of attempts (the primary and any SECONDARY)
  - which letters are INCOMPLETE, and why
  - where available, cost, tokens and latency from the output metrics
- Totals:
  - dangerous fields (out of 32)
  - dangerous summary breaches
  - false warnings
  - conflict hits out of those expected
  - safe underclaims
  - QUALIFIED
  - CONTRACT-MISUSE
- Two letters per category checks whether recent fixes generalize. It is not a statistical estimate, so results are reported per letter and per field, without percentages.

## Letter hashes (SHA-256)

| File | SHA-256 |
|---|---|
| C01.txt | b586bea56c23c85d28f320960cd5b06597a94d7db14793c5a42b46ece96a1c63 |
| C02.txt | 501c6cc873e15ed6cc28876d7be1b4d8aafd4f5bfa7882042f6be0b7387b3967 |
| C03.txt | a99aee048f010250102b126d4ff12eb4221d86d1ea07199a2ddc4c2a60510188 |
| C04.txt | e92697b3167076118406a3f047f0ef2b64b3af25e0c2a9219846c0e25f063bd9 |
| C05.txt | ad18c63b062b0c333effdf3440d4259c4e51247be1e92ffef41c67cf2fd07efa |
| C06.txt | 4b28da2d08bcd47287c61615abedc1470b2e9592a5bf619d2b3e1f2a609a2383 |
| C07.txt | cc3c0a0f744f7c317ca4731086eb50dd682c15e38ac7513e8d73717de573c614 |
| C08.txt | 2f4536d68c5cffbd09c5719fa88f2ebe5e7c8d709c922b95e8eb536060065ed1 |
