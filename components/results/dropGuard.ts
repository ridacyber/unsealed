// owner: m
"use client";

import { useEffect, useState } from "react";

/** The parts of a drag event the guard reads and changes. */
export interface FileDragEvent {
  type: string;
  preventDefault(): void;
  dataTransfer: { types: ArrayLike<string> | readonly string[]; dropEffect: string } | null;
}

function holdsFiles(event: FileDragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

/**
 * Stops a file dragged over the results from being opened by the browser in
 * place of the page, which would lose the analysis. The file is refused, not
 * used: nothing is read, uploaded or analyzed. Drags that aren't files (text,
 * links) are left alone. Returns whether the event was a file drag.
 */
export function refuseFileDrag(event: FileDragEvent): boolean {
  if (!holdsFiles(event)) return false;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
  return true;
}

/** How long the explanation stays up after the file is let go. */
const NOTICE_MS = 4000;
/** No dragover for this long means the file has left the window. */
const DRAG_IDLE_MS = 400;

/**
 * Guards the whole window while the results are shown. Returns true while
 * the person should be told why their file isn't being opened.
 */
export function useResultsDropGuard(): boolean {
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hideAfter = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => setExplaining(false), ms);
    };
    const onDrag = (event: DragEvent) => {
      if (!refuseFileDrag(event)) return;
      setExplaining(true);
      hideAfter(event.type === "drop" ? NOTICE_MS : DRAG_IDLE_MS + NOTICE_MS);
    };
    const types = ["dragenter", "dragover", "drop"] as const;
    for (const type of types) window.addEventListener(type, onDrag);
    return () => {
      clearTimeout(timer);
      for (const type of types) window.removeEventListener(type, onDrag);
    };
  }, []);

  return explaining;
}
