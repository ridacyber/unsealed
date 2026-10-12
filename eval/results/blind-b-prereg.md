# Blind set B (B01-B08): run rules, written before the run

Date: 2026-10-12
Setup: Qwen extracts, NVIDIA Nemotron Ultra checks for contradictions (see .env.example).
Letters: B01-B08 as .txt files. The answer key is held privately by m and has not been seen by Rida.

Rules
- One run per letter on a recorded commit. No tuning after seeing results.
- Only infrastructure failures (HTTP errors, timeouts, a failed contradiction check) may be rerun, and any rerun is disclosed.
- Any letter that produced an output counts as its first run.
- Raw outputs are saved and committed before m scores them.
- Results are reported per category and per field, listing every field shown Verified despite conflicting or unclear evidence.
- PDF-path behavior is tested separately and not covered by this run.
