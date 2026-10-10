// lib/extract.ts
// Uploaded PDF -> plain text (text layer only). The MVP is PDF-only.
import { extractText, getDocumentProxy } from "unpdf";
import { ExplainError } from "./explain";

const MAX_BYTES = 10 * 1024 * 1024;

// Trust the file's bytes, not the browser's claimed type.
function isPdf(buf: Uint8Array): boolean {
  return buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
}

export async function fileToText(file: File): Promise<string> {
  if (file.size === 0) throw new ExplainError("That file is empty.");
  if (file.size > MAX_BYTES) throw new ExplainError("That file is over 10 MB.");

  const buf = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(buf)) throw new ExplainError("Please upload a PDF.");

  let text = "";
  try {
    const pdf = await getDocumentProxy(buf);
    const out = await extractText(pdf, { mergePages: true });
    text = typeof out.text === "string" ? out.text : "";
  } catch {
    throw new ExplainError("We couldn't open that PDF. Try a different file.");
  }
  if (text.trim().length < 20) {
    throw new ExplainError("That PDF has no readable text (it may be a scan). Try a PDF saved or exported from the original document.");
  }
  return text;
}

//test