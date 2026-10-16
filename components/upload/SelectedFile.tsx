// owner: m
import { formatFileSize } from "@/components/lib/validateFile";

const ACTION =
  "inline-flex min-h-10 cursor-pointer items-center font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white";

interface SelectedFileProps {
  file: File;
  /** The hidden file input, so "Choose a different file" can open it. */
  inputId: string;
  onRemove: () => void;
}

/** The chosen file, in the drop zone, with the ways to change your mind. */
export function SelectedFile({ file, inputId, onRemove }: SelectedFileProps) {
  return (
    <div className="min-w-0">
      <p className="text-[1.05rem] font-bold break-words">{file.name}</p>
      <p className="mt-0.5 text-[0.95rem] text-fog">
        PDF &middot; {formatFileSize(file.size)} &middot; ready to analyze
      </p>
      <div className="flex flex-wrap gap-x-5">
        <label htmlFor={inputId} className={ACTION}>
          Choose a different file
        </label>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className={ACTION}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
