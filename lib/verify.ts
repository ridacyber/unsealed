// lib/verify.ts
// Finds each model-claimed quote in the letter and decides verified / unsure / not_found.
import type { Field, FieldName } from "./schema";

export interface RawField {
  found: boolean;
  value: string | null;
  normalized: string | null;
  quote: string | null;
  confidence: number;
  note: string | null;
  conflict?: boolean;
  vague?: boolean;
}

const CONFIDENCE_FLOOR = 0.6;

// Lowercase + collapse whitespace + straighten quotes/dashes, keeping a map back to original offsets.
function normalizeWithMap(text: string): { out: string; map: number[] } {
  let out = "";
  const map: number[] = [];
  let prevSpace = true; // also trims leading space
  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    if (ch === "\u2018" || ch === "\u2019") ch = "'";
    else if (ch === "\u201c" || ch === "\u201d") ch = '"';
    else if (ch === "\u2013" || ch === "\u2014") ch = "-";
    if (/\s/.test(ch)) {
      if (prevSpace) continue;
      ch = " ";
      prevSpace = true;
    } else {
      prevSpace = false;
    }
    for (const c of ch.toLowerCase()) {
      out += c;
      map.push(i);
    }
  }
  return { out, map };
}

export interface DocIndex {
  text: string;
  out: string;
  map: number[];
}

export function indexDocument(text: string): DocIndex {
  return { text, ...normalizeWithMap(text) };
}

function locate(quote: string, doc: DocIndex): { start: number; end: number } | null {
  const q = normalizeWithMap(quote).out.trim();
  if (q.length < 3) return null;
  const idx = doc.out.indexOf(q);
  if (idx === -1) return null;
  return { start: doc.map[idx], end: doc.map[idx + q.length - 1] + 1 };
}

const digits = (s: string) => s.replace(/\D/g, "");
const clamp01 = (n: unknown) => (typeof n === "number" && isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function verifyField(name: FieldName, raw: RawField | undefined, doc: DocIndex): Field {
  const missing = (status: Field["status"], note: string | null, confidence = 0): Field => ({
    status, value: null, normalized: null, citation: null, confidence, note,
  });

  if (!raw || typeof raw !== "object") {
    return missing("unsure", "We couldn't read this part reliably. Please check the letter or ask a person.");
  }

  // The model says the letter doesn't state this.
  if (!raw.found || !raw.value) {
    return missing("not_found", raw.note ?? "The letter doesn't say.", clamp01(raw.confidence));
  }

  const value = raw.value.trim();
  const quote = (raw.quote ?? "").trim();
  const confidence = clamp01(raw.confidence);
  const base = { value, normalized: raw.normalized ?? null, confidence };

  const unsure = (note: string, start = -1, end = -1): Field => ({
    ...base,
    status: "unsure",
    citation: quote ? { quote, start, end } : null,
    note,
  });

  if (!quote) return unsure("No supporting text from the letter. Please check with a person.");

  const hit = locate(quote, doc);
  if (!hit) return unsure("We couldn't find this in your letter's text. Please check with a person.");

  // Amounts: the digits the model reported must actually appear in the quoted text.
  if (name === "amountOwed" && !digits(quote).includes(digits(value))) {
    return unsure("The amount we read doesn't match the letter's wording. Please double-check.", hit.start, hit.end);
  }

  if (raw.conflict) {
    return unsure(raw.note ?? "This letter gives different answers in different places. Please confirm with the sender.", hit.start, hit.end);
  }
  if (raw.vague) {
    return unsure(raw.note ?? "The letter is vague here. Please confirm with the sender.", hit.start, hit.end);
  }

  if (confidence < CONFIDENCE_FLOOR) {
    return unsure(raw.note ?? "We're not confident about this one. Please check with a person.", hit.start, hit.end);
  }

  return { ...base, status: "verified", citation: { quote, start: hit.start, end: hit.end }, note: raw.note ?? null };
}