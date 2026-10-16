// owner: m
"use client";

import { useEffect, useId, useLayoutEffect, useState, type RefObject } from "react";
import { connectorGeometry, type Connector } from "./connector";

export type ThreadTone = "verified" | "unsure" | "conflict";

interface EvidenceThreadsProps {
  /** The box the threads are drawn in; it holds the cards and the letter. */
  containerRef: RefObject<HTMLElement | null>;
  /** Changes whenever different evidence is chosen; null when none is. */
  selectionKey: string | null;
  tone: ThreadTone;
}

/**
 * The thread from the chosen card to its passage in the letter, ending at a
 * bracket in the margin beside the passage's lines. It reads the page as it
 * is: it starts at the element marked `data-evidence-source` and ends at the
 * passage marked `data-mark-active`, both of which are only set for
 * evidence whose place in the letter has been confirmed. With nothing
 * confirmed, nothing is drawn. Decoration only: hidden from assistive
 * technology, and it never takes a pointer event.
 */
export function EvidenceThreads({
  containerRef,
  selectionKey,
  tone,
}: EvidenceThreadsProps) {
  const [connector, setConnector] = useState<Connector | null>(null);
  const maskId = `rw-thread-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || selectionKey === null) {
      setConnector(null);
      return;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      setConnector(measureConnector(container));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const scroller = container.querySelector("[data-letter-scroller]");
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    scroller?.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      scroller?.removeEventListener("scroll", schedule);
    };
  }, [containerRef, selectionKey]);

  // Fonts arriving late move the lines; measure once more when they settle.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || selectionKey === null) return;
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) setConnector(measureConnector(container));
    });
    return () => {
      cancelled = true;
    };
  }, [containerRef, selectionKey]);

  if (!connector || selectionKey === null) return null;

  return (
    <svg className="rw-threads" aria-hidden="true" focusable="false">
      {/* Keyed by the selection, so a new choice draws its thread afresh
          while scrolling only moves the one already drawn. */}
      <g key={selectionKey} className="rw-thread" data-tone={tone}>
        <linearGradient
          id={`${maskId}-ink`}
          gradientUnits="userSpaceOnUse"
          x1={connector.from.x}
          y1={connector.from.y}
          x2={connector.to.x}
          y2={connector.to.y}
        >
          <stop offset="0" className="rw-thread-ink-from" />
          <stop offset="1" className="rw-thread-ink-to" />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <path d={connector.d} pathLength={1} className="rw-thread-reveal" />
        </mask>
        <path
          d={connector.d}
          className="rw-thread-line"
          stroke={`url(#${maskId}-ink)`}
          mask={`url(#${maskId})`}
        />
        <path d={connector.bracket} className="rw-thread-bracket" />
        <circle cx={connector.from.x} cy={connector.from.y} r={3.5} className="rw-thread-pin" />
      </g>
    </svg>
  );
}

function measureConnector(container: HTMLElement): Connector | null {
  const source = container.querySelector("[data-evidence-source]");
  const scroller = container.querySelector("[data-letter-scroller]");
  const sheet = container.querySelector("[data-letter-sheet]");
  const marks = container.querySelectorAll("[data-mark-active]");
  if (!source || !scroller || !sheet || marks.length === 0) return null;

  const lines = [...marks].flatMap((mark) => [...mark.getClientRects()]);
  const origin = container.getBoundingClientRect();
  return connectorGeometry({
    source: source.getBoundingClientRect(),
    sheet: sheet.getBoundingClientRect(),
    scroller: scroller.getBoundingClientRect(),
    lines,
    viewportHeight: window.innerHeight,
    origin,
  });
}
