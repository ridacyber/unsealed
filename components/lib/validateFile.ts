// owner: m
export const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ACCEPTED_TYPES: Readonly<Record<string, readonly string[]>> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

/** Value for the file input's `accept` attribute. */
export const ACCEPT_ATTRIBUTE = Object.entries(ACCEPTED_TYPES)
  .flatMap(([mime, extensions]) => [mime, ...extensions])
  .join(",");

export type FileProblem = "unsupported_type" | "too_large" | "empty";

export type FileValidation =
  { ok: true } | { ok: false; problem: FileProblem; message: string };

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export function isPdf(file: File): boolean {
  return file.type === "application/pdf" || extensionOf(file.name) === ".pdf";
}

function isAcceptedType(file: File): boolean {
  // Some browsers and operating systems leave `type` empty, so fall back to
  // the file extension rather than rejecting a perfectly good letter.
  if (file.type) return file.type in ACCEPTED_TYPES;
  const extension = extensionOf(file.name);
  return Object.values(ACCEPTED_TYPES).some((extensions) =>
    extensions.includes(extension),
  );
}

export function validateFile(file: File): FileValidation {
  if (!isAcceptedType(file)) {
    return {
      ok: false,
      problem: "unsupported_type",
      message:
        "That file type isn't supported. Choose a PDF, or a JPG or PNG photo of your letter.",
    };
  }
  if (file.size === 0) {
    return {
      ok: false,
      problem: "empty",
      message:
        "That file looks empty. Try saving or scanning the letter again, then choose the new file.",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      problem: "too_large",
      message: `That file is larger than ${MAX_FILE_SIZE_MB} MB. Try a smaller scan or a photo of the letter instead.`,
    };
  }
  return { ok: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
