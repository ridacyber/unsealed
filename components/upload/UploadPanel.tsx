// owner: m
"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { AlertIcon, UploadIcon } from "@/components/ui/icons";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_SIZE_MB,
  validateFile,
} from "@/components/lib/validateFile";
import { SelectedFile } from "./SelectedFile";

interface UploadPanelProps {
  onAnalyze: (file: File) => void;
  /** Shown under the button; depends on whether files leave the browser. */
  privacyNote: string;
}

export function UploadPanel({ onAnalyze, privacyNote }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = useId();

  function choose(candidate: File | undefined) {
    if (!candidate) return;
    const validation = validateFile(candidate);
    if (validation.ok) {
      setFile(candidate);
      setError(null);
    } else {
      setFile(null);
      setError(validation.message);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setIsDragging(false);
  }

  function handleRemove() {
    setFile(null);
    inputRef.current?.focus();
  }

  function handleAnalyze() {
    if (file) {
      onAnalyze(file);
    } else {
      setError("Add your letter first, as a PDF.");
      inputRef.current?.focus();
    }
  }

  return (
    <section aria-labelledby="upload-heading" className="relative pt-14">
      <div
        aria-hidden="true"
        className="envelope-lining envelope-open absolute inset-0"
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative mx-4 mb-4 rounded-xl bg-sheet p-5 shadow-[0_1px_2px_rgb(20_33_58/0.08),0_12px_32px_-12px_rgb(20_33_58/0.35)] sm:mx-6 sm:mb-6 sm:p-7"
      >
        <h2 id="upload-heading" className="font-display text-2xl font-semibold">
          Add your letter
        </h2>

        {/* The input stays mounted so focus has somewhere to return to. */}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          aria-describedby={hintId}
          className="file-input sr-only"
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {file ? (
          <div className="mt-5">
            <SelectedFile file={file} onRemove={handleRemove} />
            <label
              htmlFor={inputId}
              className="mt-3 inline-block cursor-pointer font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal"
            >
              Choose a different file
            </label>
          </div>
        ) : (
          <div
            className={`mt-5 rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors ${
              isDragging ? "border-postal bg-tint" : "border-line bg-paper/60"
            }`}
          >
            <UploadIcon
              width={28}
              height={28}
              className="mx-auto text-postal"
            />
            <p className="mt-3 text-lg font-semibold">Drag your PDF here</p>
            <p className="mt-1 text-ink-soft">or</p>
            <label
              htmlFor={inputId}
              className="mt-2 inline-flex min-h-12 cursor-pointer items-center rounded-lg border border-ink/25 bg-sheet px-5 font-semibold transition-colors hover:border-ink/60"
            >
              Choose a PDF
            </label>
          </div>
        )}

        <p id={hintId} className="mt-3 text-sm text-ink-soft">
          PDF only, up to {MAX_FILE_SIZE_MB} MB.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 flex gap-2 rounded-lg bg-alert-tint p-3 text-alert"
          >
            <AlertIcon className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <p role="status" className="sr-only">
          {file ? `${file.name} selected.` : ""}
        </p>

        <Button onClick={handleAnalyze} className="mt-6 w-full text-lg">
          Analyze document
        </Button>

        <p className="mt-4 text-sm text-ink-soft">{privacyNote}</p>
      </div>
    </section>
  );
}
