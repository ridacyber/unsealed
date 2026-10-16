// owner: m
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertIcon, ChevronIcon } from "@/components/ui/icons";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_SIZE_MB,
  validateFile,
} from "@/components/lib/validateFile";
import { DropSlot } from "./DropSlot";
import { SelectedFile } from "./SelectedFile";

/** Dressed like the secondary Button: a label can't be a Button, and a
    button can't open the file picker without script. */
const CHOOSE_LABEL =
  "mt-2.5 inline-flex min-h-11 cursor-pointer items-center rounded-control border border-(color:--btn-secondary-border) bg-(--btn-secondary-bg) px-4 font-semibold text-(--btn-secondary-text) transition-[transform,background-color,border-color,color] duration-150 ease-out hover:border-(color:--btn-secondary-hover-border) motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.97]";

/**
 * How long the page waits without a `dragover` before deciding the file has
 * left the window. `dragover` repeats every few dozen milliseconds while a
 * file is over the page, and some browsers don't report the final
 * `dragleave` reliably.
 */
const DRAG_IDLE_MS = 400;

/** What the drop zone shows: nothing yet, a file held over it, a chosen file, or a problem. */
type DropState = "empty" | "drag" | "chosen" | "error";

interface UploadPanelProps {
  onAnalyze: (file: File) => void;
  /** Shown under the button; depends on whether files leave the browser. */
  privacyNote: string;
}

function holdsFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

export function UploadPanel({ onAnalyze, privacyNote }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = useId();

  const dropState: DropState = isDragging
    ? "drag"
    : file
      ? "chosen"
      : error
        ? "error"
        : "empty";

  const choose = useCallback((candidate: File | undefined) => {
    if (!candidate) return;
    const validation = validateFile(candidate);
    if (validation.ok) {
      setFile(candidate);
      setError(null);
    } else {
      setFile(null);
      setError(validation.message);
    }
  }, []);

  // A file can be dropped anywhere on the page, not only on the panel.
  // Without this, a PDF dropped a little off target is opened by the
  // browser in place of the page.
  useEffect(() => {
    let depth = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      depth = 0;
      setIsDragging(false);
    };
    const stillHere = () => {
      clearTimeout(idle);
      idle = setTimeout(settle, DRAG_IDLE_MS);
    };
    const onEnter = (event: DragEvent) => {
      if (!holdsFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setIsDragging(true);
      stillHere();
    };
    const onOver = (event: DragEvent) => {
      if (!holdsFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
      stillHere();
    };
    const onLeave = (event: DragEvent) => {
      if (!holdsFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) settle();
    };
    const onDrop = (event: DragEvent) => {
      if (!holdsFiles(event)) return;
      event.preventDefault();
      clearTimeout(idle);
      settle();
      choose(event.dataTransfer?.files[0]);
      // Bring the panel into view if the file was dropped further down.
      const panel = panelRef.current;
      if (!panel) return;
      const { top, bottom } = panel.getBoundingClientRect();
      if (top < 0 || bottom > window.innerHeight) {
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        panel.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
      }
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      clearTimeout(idle);
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [choose]);

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
    <section
      ref={panelRef}
      aria-labelledby="upload-heading"
      data-ready={file ? "" : undefined}
      className="upload-panel mt-8 rounded-panel border border-glass-line bg-glass p-5 shadow-[0_40px_70px_-40px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.08)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="upload-heading" className="font-display text-2xl font-semibold">
          Add your letter
        </h2>
        <span className="hidden rounded-full border border-glass-line px-2.5 py-1.5 text-[0.7rem] font-semibold tracking-[0.08em] text-fog uppercase sm:inline-block">
          PDF &middot; up to {MAX_FILE_SIZE_MB} MB
        </span>
      </div>

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

      <div
        data-state={dropState}
        className="upload-drop mt-4 grid grid-cols-[auto_1fr] items-center gap-4 rounded-card px-4 py-4 max-[359px]:grid-cols-1"
      >
        {/* On the narrowest phones the envelope gives its room to the words. */}
        <DropSlot />

        {file ? (
          <SelectedFile file={file} inputId={inputId} onRemove={handleRemove} />
        ) : (
          <div className="min-w-0">
            <p className="text-[1.05rem] font-bold">
              {isDragging ? "Drop it here" : "Drag your PDF here"}
            </p>
            <p className="mt-0.5 text-[0.95rem] text-fog">or</p>
            <label htmlFor={inputId} className={CHOOSE_LABEL}>
              Choose a PDF
            </label>
          </div>
        )}
      </div>

      <p id={hintId} className="mt-3 text-sm leading-relaxed text-fog">
        PDF only, up to {MAX_FILE_SIZE_MB} MB.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 flex gap-2 rounded-control border border-alert-line/50 bg-alert-line/15 p-3 font-semibold text-[#ffd9d9]"
        >
          <AlertIcon className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <p role="status" className="sr-only">
        {file ? `${file.name} selected.` : ""}
      </p>

      <Button
        onClick={handleAnalyze}
        className="analyze-cta relative mt-4 min-h-[54px] w-full overflow-hidden text-lg"
      >
        Analyze document
        <ChevronIcon direction="right" width={20} height={20} />
      </Button>

      <p className="mt-4 text-sm leading-relaxed text-fog">{privacyNote}</p>

      {/* While a file is held anywhere over the page, the whole window is
          the target. The words are for sighted people dragging a file;
          nothing here can be reached otherwise. */}
      <div className="drop-veil" data-on={isDragging ? "" : undefined} aria-hidden="true">
        <div className="drop-veil-frame" data-state="drag">
          <DropSlot large />
          <p className="drop-veil-title">Drop your letter to add it</p>
          <p className="drop-veil-hint">PDF only, up to {MAX_FILE_SIZE_MB} MB</p>
        </div>
      </div>
    </section>
  );
}
