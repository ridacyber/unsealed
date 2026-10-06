// owner: m
import { CloseIcon, DocumentIcon } from "@/components/ui/icons";
import { formatFileSize, isPdf } from "@/components/lib/validateFile";

interface SelectedFileProps {
  file: File;
  onRemove: () => void;
}

export function SelectedFile({ file, onRemove }: SelectedFileProps) {
  const kind = isPdf(file) ? "PDF" : "Image";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-tint text-postal">
        <DocumentIcon width={24} height={24} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold break-words">{file.name}</p>
        <p className="text-sm text-ink-soft">
          {kind} · {formatFileSize(file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-line/60 hover:text-ink"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
