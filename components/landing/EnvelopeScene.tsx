// owner: m
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/results/StatusBadge";
import styles from "./EnvelopeScene.module.css";
import { passageEnd, threadPath, type Point } from "./threads";

/**
 * How long the first run waits for the letter's web font before starting
 * anyway. Starting before the font arrives would reflow the lines, and the
 * highlights with them, mid-opening. Fonts are self-hosted and preloaded,
 * so the wait is normally a few milliseconds.
 */
const FONT_WAIT_MS = 1500;

/**
 * Example answers, written by hand to show the idea. Nothing here comes from
 * an analysis, and the scene's label says so. The keys tie each note to its
 * passage in the letter, so pointing at one lights the other; the quote is
 * that passage, shown in the note where there is no room for a thread.
 */
const NOTES = [
  {
    key: "amount",
    question: "How much?",
    status: "verified",
    value: "$1,250.00",
    quote: "tuition balance of $1,250.00",
  },
  {
    key: "deadline",
    question: "When?",
    status: "verified",
    value: "November 15, 2026",
    quote: "November 15, 2026",
  },
  {
    key: "action",
    question: "What do I need to do?",
    status: "unsure",
    value: "We couldn’t confirm this",
    why: "Two things are asked, and the form has no deadline.",
    quote: "submit your signed verification form",
  },
] as const;

type NoteKey = (typeof NOTES)[number]["key"];

/**
 * How far the letter rises, as a share of its own height. Keep in step with
 * `letter-rise` in EnvelopeScene.module.css: the threads are measured against
 * where the letter will stand, so they draw on the same timeline as the rest
 * of the opening rather than waiting for it to finish.
 */
const LETTER_RISE = 0.303;

interface Thread {
  key: NoteKey;
  status: "verified" | "unsure";
  d: string;
  from: Point;
  to: Point;
}

/**
 * The envelope that opens on the landing page: the flap folds back, light
 * spills from the opening, the letter rises, three passages are swept with
 * highlighter and three notes land, each tied to its passage by a thread.
 * Decoration only: the letter is made up and the notes are examples.
 * "Replay the opening" mounts the scene afresh, so every layer resets at
 * once and the opening plays again from sealed.
 */
export function EnvelopeScene() {
  const [run, setRun] = useState(0);

  return (
    <div className={styles.scene}>
      <p className={styles.label}>
        <span aria-hidden="true" className={styles.labelRule} />
        Illustration &middot; a made-up letter
      </p>
      <Opening key={run} />
      <button
        type="button"
        className={styles.replay}
        onClick={() => setRun((count) => count + 1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Replay the opening
      </button>
    </div>
  );
}

/** One run of the opening. Renders sealed, then starts once mounted. */
function Opening() {
  const [playing, setPlaying] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const deskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The server renders the sealed envelope; the opening only starts here,
    // after hydration, once the letter's font is ready. Strict Mode runs this
    // twice: the first run's result is discarded by its cleanup.
    let cancelled = false;
    const fontsReady =
      typeof document !== "undefined" && document.fonts?.ready
        ? document.fonts.ready
        : Promise.resolve();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const atTheLatest = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, FONT_WAIT_MS);
    });
    Promise.race([fontsReady, atTheLatest]).then(() => {
      if (!cancelled) setPlaying(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Measured before paint, so the threads start in the same frame as the
  // rest of the opening; measured again whenever the scene changes size.
  useLayoutEffect(() => {
    const desk = deskRef.current;
    if (!playing || !desk) return;
    const measure = () => setThreads(measureThreads(desk));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(desk);
    return () => observer.disconnect();
  }, [playing]);

  return (
    <div
      ref={deskRef}
      className={`${styles.desk} ${playing ? styles.play : ""} ${threads.length ? styles.threaded : ""}`}
    >
      <div className={styles.stage}>
        {/* The light: what spills from the opening, and its pool on the
            desk. Sized like the envelope and painted behind it. */}
        <div className={styles.halo} aria-hidden="true" />

        {/* Back to front: lining, the flap's inner face, the pocket with the
            letter, the shade inside the pocket, two side flaps, the bottom
            flap, the flap's outer face. See EnvelopeScene.module.css. */}
        <div className={styles.envelope} aria-hidden="true">
          <div className={styles.back} />
          <div className={`${styles.flap} ${styles.flapInner}`}>
            <div className={styles.face} />
          </div>
          <div className={styles.pocket}>
            <div className={styles.letter}>
              <p className={styles.letterHead}>
                HARTWELL STATE UNIVERSITY
                <span className={styles.letterSub}>
                  <br />
                  Office of Financial Aid
                </span>
              </p>
              <p>
                Your 2026-27 financial aid award has been adjusted. Your{" "}
                <mark data-key="amount" style={{ "--i": 0 } as React.CSSProperties}>
                  tuition balance of $1,250.00
                </mark>{" "}
                is due by{" "}
                <mark data-key="deadline" style={{ "--i": 1 } as React.CSSProperties}>
                  November 15, 2026
                </mark>
                .
              </p>
              <p>
                To keep your award, please{" "}
                <mark data-key="action" style={{ "--i": 2 } as React.CSSProperties}>
                  submit your signed verification form
                </mark>{" "}
                to the Office of Financial Aid.
              </p>
              <p>
                If payment is not received by that date, a $75 late fee will be
                applied and your spring registration may be placed on hold.
              </p>
            </div>
          </div>
          <div className={styles.shade} />
          <div className={`${styles.side} ${styles.sideL}`} />
          <div className={`${styles.side} ${styles.sideR}`} />
          <div className={styles.bottom} />
          <div className={`${styles.flap} ${styles.flapOuter}`}>
            <div className={styles.face} />
          </div>
        </div>
      </div>

      {threads.length > 0 && (
        <svg className={styles.threads} aria-hidden="true" focusable="false">
          {threads.map((thread, index) => (
            <g
              key={thread.key}
              data-key={thread.key}
              className={`${styles.thread} ${thread.status === "unsure" ? styles.threadUnsure : ""}`}
              style={{ "--i": index } as React.CSSProperties}
            >
              {/* Highlighter at the passage, light at the answer. In page
                  units: a level thread has no height for a box to measure. */}
              <linearGradient
                id={`thread-ink-${thread.key}`}
                gradientUnits="userSpaceOnUse"
                x1={thread.from.x}
                x2={thread.to.x}
                y1={thread.from.y}
                y2={thread.to.y}
              >
                <stop offset="0" className={styles.inkFrom} />
                <stop offset="1" className={styles.inkTo} />
              </linearGradient>
              {/* The visible line is revealed by a solid copy of itself that
                  draws on, so a dashed thread can draw on too. */}
              <mask id={`thread-mask-${thread.key}`} maskUnits="userSpaceOnUse">
                <path d={thread.d} pathLength={1} className={styles.threadReveal} />
              </mask>
              <path
                d={thread.d}
                className={styles.threadLine}
                stroke={`url(#thread-ink-${thread.key})`}
                mask={`url(#thread-mask-${thread.key})`}
              />
              <circle
                cx={thread.from.x}
                cy={thread.from.y}
                r={3}
                className={styles.threadPin}
              />
              <circle
                cx={thread.to.x}
                cy={thread.to.y}
                r={2.5}
                className={styles.threadEnd}
              />
            </g>
          ))}
        </svg>
      )}

      <ul
        className={styles.notes}
        aria-label="Example answers, written by hand to show the idea. Not a live analysis."
      >
        {NOTES.map((note, index) => (
          <li
            key={note.key}
            data-key={note.key}
            className={`${styles.note} ${note.status === "unsure" ? styles.noteUnsure : ""}`}
            style={{ "--i": index } as React.CSSProperties}
          >
            <span className={styles.noteQ}>{note.question}</span>
            <StatusBadge status={note.status} />
            <strong className={styles.noteV}>{note.value}</strong>
            {"why" in note && <span className={styles.noteWhy}>{note.why}</span>}
            <span className={styles.noteQuote}>
              <span className="sr-only">The letter says: </span>
              &ldquo;{note.quote}&rdquo;
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Where each thread runs: from the end of its passage, as the letter will
 * stand once it has risen, to the near edge of its note. Threads are only
 * drawn when the notes stand beside the envelope; stacked under it, each
 * note shows its passage as a quote instead.
 */
function measureThreads(desk: HTMLElement): Thread[] {
  const stage = desk.querySelector<HTMLElement>(`.${styles.stage}`);
  const letter = desk.querySelector<HTMLElement>(`.${styles.letter}`);
  const firstNote = desk.querySelector<HTMLElement>(`.${styles.note}`);
  if (!stage || !letter || !firstNote) return [];
  if (offsetWithin(firstNote, desk).left < offsetWithin(stage, desk).left + stage.offsetWidth) {
    return [];
  }

  const deskBox = desk.getBoundingClientRect();
  const letterBox = letter.getBoundingClientRect();
  // The letter's top once risen, in desk coordinates. Offsets ignore the
  // transform it may be part-way through, so this holds at any moment.
  const risenTop =
    offsetWithin(letter, desk).top - LETTER_RISE * letter.offsetHeight;

  const threads: Thread[] = [];
  for (const note of NOTES) {
    const mark = letter.querySelector(`mark[data-key="${note.key}"]`);
    const card = desk.querySelector<HTMLElement>(`li[data-key="${note.key}"]`);
    const end = mark ? passageEnd([...mark.getClientRects()]) : null;
    if (!card || !end) return [];
    const cardAt = offsetWithin(card, desk);
    // The pin sits on the end of the highlight, clear of any full stop.
    const from = {
      x: end.right - deskBox.left,
      y: risenTop + (end.middle - letterBox.top),
    };
    const to = { x: cardAt.left - 1, y: cardAt.top + card.offsetHeight / 2 };
    threads.push({ key: note.key, status: note.status, d: threadPath(from, to), from, to });
  }
  return threads;
}

/** An element's layout position inside an ancestor, ignoring transforms. */
function offsetWithin(element: HTMLElement, ancestor: HTMLElement) {
  let left = 0;
  let top = 0;
  for (
    let node: HTMLElement | null = element;
    node && node !== ancestor;
    node = node.offsetParent as HTMLElement | null
  ) {
    left += node.offsetLeft;
    top += node.offsetTop;
  }
  return { left, top };
}
