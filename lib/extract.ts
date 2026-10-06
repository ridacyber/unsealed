import { extractText, getDocumentProxy } from "unpdf";
import { ExplainError } from "./explain";

const MAX_BYTES = 10 * 1024 * 1024;

type Kind = "pdf" | "png" | "jpeg" | "text";

// Trust the bytes, not the browser's claimed mime type.
function sniff(buf: Uint8Array, name: string): Kind | null {
  if (buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "pdf";
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (name.toLowerCase().endsWith(".txt")) return "text";
  return null;
}

async function pdfToText(buf: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    return typeof text === "string" ? text : "";
  } catch {
    throw new ExplainError("We couldn't open that PDF. Try a different file.");
  }
}

async function imageToText(buf: Uint8Array, mime: string): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = (process.env.LLM_BASE_URL ?? "").replace(/\/$/, "");
  const model = process.env.LLM_VISION_MODEL;
  if (!apiKey || !baseUrl || !model) {
    throw new ExplainError("Photo uploads aren't available yet. Please upload a text PDF.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Transcribe ALL the text in this image exactly as written. Keep line breaks. Do not summarize, translate, correct, or add anything. If there is no readable text, reply with nothing.",
              },
              { type: "image_url", image_url: { url: `data:${mime};base64,${Buffer.from(buf).toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new ExplainError("We couldn't read that image. Try a clearer photo or a PDF.");
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } catch (err) {
    if (err instanceof ExplainError) throw err;
    throw new ExplainError("We couldn't read that image. Try a clearer photo or a PDF.");
  } finally {
    clearTimeout(timer);
  }
}

export async function fileToText(file: File): Promise<string> {
  if (file.size === 0) throw new ExplainError("That file is empty.");
  if (file.size > MAX_BYTES) throw new ExplainError("That file is over 10 MB.");

  const buf = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(buf, file.name);
  if (!kind) throw new ExplainError("Please upload a PDF, JPG, or PNG.");

  let text: string;
  if (kind === "pdf") {
    text = await pdfToText(buf);
    if (text.trim().length < 20) {
      throw new ExplainError("That PDF looks like a scan with no readable text. Try uploading a photo of it instead.");
    }
  } else if (kind === "text") {
    text = new TextDecoder("utf-8").decode(buf);
  } else {
    text = await imageToText(buf, kind === "png" ? "image/png" : "image/jpeg");
    if (text.trim().length < 20) {
      throw new ExplainError("We couldn't find readable text in that image. Try a clearer, well-lit photo.");
    }
  }
  return text;
}
