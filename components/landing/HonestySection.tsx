// owner: m
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/results/StatusBadge";
import type { FieldStatus } from "@/lib/schema";
import styles from "./HonestySection.module.css";
import { threadPath, type Point } from "./threads";

const STATES: ReadonlyArray<{
  status: FieldStatus;
  meaning: string;
  /** What the illustration beside the text shows, for anyone who can't see it. */
  example: string;
}> = [
  {
    status: "verified",
    meaning:
      "The answer is supported by words found in your letter. You can review the supporting quote and, when available, see where it appears in the letter.",
    example:
      "“How much?” is answered from the letter’s own words, “tuition balance of $1,250.00”.",
  },
  {
    status: "unsure",
    meaning:
      "The wording is vague, or it couldn't be confirmed against the letter. You see what the letter says, without a guess from us.",
    example:
      "The letter asks for two things, a payment and a signed form, and gives the form no deadline.",
  },
  {
    status: "not_found",
    meaning:
      "The letter doesn't say. We tell you that and leave the gap empty.",
    example: "In this version of the letter, no amount is given at all.",
  },
];

/**
 * What Unsealed can and can't confirm, told on one made-up letter. On a wide
 * screen the letter stays in view while the three states scroll past it,
 * and it changes to show whichever state is in the middle of the screen: a
 * passage found, two passages that don't settle it, and nothing to point
 * to. On a phone each state carries its own excerpt of the letter instead.
 * The pictures are decoration; the text beside them says the same.
 */
export function HonestySection() {
  const [active, setActive] = useState<FieldStatus>("verified");
  // The furthest state reached, so a phone's excerpts stay lit once seen.
  const [reached, setReached] = useState(0);
  const stepsRef = useRef<HTMLDListElement>(null);

  useEffect(() => {
    const steps = stepsRef.current?.querySelectorAll<HTMLElement>("[data-step]");
    if (!steps?.length) return;
    // A thin band just above the middle of the screen: the state crossing it
    // is the one the letter shows.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.step);
          setActive(STATES[index].status);
          setReached((furthest) => Math.max(furthest, index));
        }
      },
      { rootMargin: "-42% 0px -57% 0px" },
    );
    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="honesty-heading" className={styles.chapter}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>
          <span aria-hidden="true" className="eyebrow-rule" />
          How sure is each answer
        </p>
        <h2 id="honesty-heading" className={styles.title}>
          What Unsealed can, and <em>can&rsquo;t</em>, confirm
        </h2>
        <p className={styles.lead}>
          A wrong date or amount is worse than none. Every detail is marked
          with how sure Unsealed is, and any words it rests on are one tap
          away.
        </p>
      </div>

      <div className={styles.body}>
        <div className={styles.stickyColumn}>
          <Specimen active={active} />
        </div>

        <dl ref={stepsRef} className={styles.steps}>
          {STATES.map(({ status, meaning, example }, index) => (
            <div
              key={status}
              data-step={index}
              data-status={status}
              data-on={active === status ? "" : undefined}
              data-seen={index <= reached ? "" : undefined}
              className={styles.step}
            >
              <dt>
                <StatusBadge status={status} />
              </dt>
              <dd>
                <p className={styles.meaning}>{meaning}</p>
                <p className={styles.example}>
                  <span className={styles.exampleLabel}>In the example</span>{" "}
                  {example}
                </p>
                <Excerpt status={status} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className={styles.caveat}>
        Verified is about those words only. A letter can say different things
        in different places, and Unsealed can miss that, especially when two
        instructions don&rsquo;t agree. Before you pay, sign or act on
        something important, read the original letter and check with the
        sender.
      </p>
    </section>
  );
}

/**
 * The example answers, dressed as the answers in the results are: paper for
 * verified, amber with a striped band for unsure, dashed for not found.
 */
function AnswerCard({ status }: { status: FieldStatus }) {
  return (
    <div className={styles.answer} data-status={status}>
      {status === "unsure" && (
        <span aria-hidden="true" className={`unsure-band ${styles.answerBand}`} />
      )}
      <div className={styles.answerTop}>
        <span className={styles.answerQ}>
          {status === "unsure" ? "What do I need to do?" : "How much?"}
        </span>
        <StatusBadge status={status} />
      </div>
      {status === "verified" && <p className={styles.answerValue}>$1,250.00</p>}
      {status === "unsure" && (
        <>
          <p className={styles.answerHeadline}>We couldn&rsquo;t confirm this</p>
          <p className={styles.answerNote}>
            Two things are asked, and the form has no deadline.
          </p>
        </>
      )}
      {status === "not_found" && (
        <>
          <p className={styles.answerHeadline}>The letter doesn&rsquo;t say</p>
          <p className={styles.answerNote}>
            Left blank rather than guessed.
          </p>
        </>
      )}
    </div>
  );
}

interface SpecimenThread {
  key: string;
  status: FieldStatus;
  d: string;
  from: Point;
  to: Point;
  /** The margin bracket beside the passage, top to bottom; none for a gap. */
  bracket: { x: number; top: number; bottom: number } | null;
}

/**
 * The letter that stays in view on a wide screen, with the example answer
 * beside it and threads between the two. All three states are drawn; the
 * active one is shown.
 */
function Specimen({ active }: { active: FieldStatus }) {
  const figureRef = useRef<HTMLDivElement>(null);
  const [threads, setThreads] = useState<SpecimenThread[]>([]);

  useLayoutEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    const measure = () => setThreads(measureSpecimen(figure));
    measure();
    // The letter's lines move when its font arrives.
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(figure);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={figureRef}
      className={styles.specimen}
      data-active={active}
      aria-hidden="true"
    >
      <span className={styles.light} data-for="verified" />
      <span className={styles.light} data-for="unsure" />
      <span className={styles.light} data-for="not_found" />

      <div className={styles.sheet}>
        <p className={styles.sheetHead}>
          HARTWELL STATE UNIVERSITY
          <br />
          Office of Financial Aid
        </p>
        <p>October 1, 2026</p>
        <p>Dear Student,</p>
        {/* Two versions of the paragraph in one place: with the amount, and
            without it for the not-found state. They cross-fade. */}
        <div className={styles.versions}>
          <p className={styles.withAmount}>
            Your 2026-27 financial aid award has been adjusted. Your{" "}
            <mark data-key="amount">tuition balance of $1,250.00</mark>{" "}
            <mark data-key="due">is due by November 15, 2026</mark>. If
            payment is not received by that date, a $75 late fee will be
            applied and your spring registration may be placed on hold.
          </p>
          <p className={styles.withoutAmount} data-key="gap">
            Your 2026-27 financial aid award has been adjusted. Your tuition
            balance is due by November 15, 2026. If payment is not received
            by that date, a $75 late fee will be applied and your spring
            registration may be placed on hold.
          </p>
        </div>
        <p>
          To keep your award, please{" "}
          <mark data-key="form">submit your signed verification form</mark> to
          the Office of Financial Aid.
        </p>
        <p>
          Sincerely,
          <br />
          Financial Aid Office
        </p>
      </div>

      {threads.length > 0 && (
        <svg className={styles.threads} focusable="false">
          {threads.map((thread) => (
            <g
              key={thread.key}
              className={styles.thread}
              data-for={thread.status}
            >
              <mask id={`specimen-mask-${thread.key}`} maskUnits="userSpaceOnUse">
                <path d={thread.d} pathLength={1} className={styles.threadReveal} />
              </mask>
              <path
                d={thread.d}
                className={styles.threadLine}
                mask={`url(#specimen-mask-${thread.key})`}
              />
              {thread.bracket && (
                <path
                  d={`M${thread.bracket.x - 5} ${thread.bracket.top} H${thread.bracket.x} V${thread.bracket.bottom} H${thread.bracket.x - 5}`}
                  className={styles.threadBracket}
                />
              )}
              {thread.status === "not_found" ? (
                <circle
                  cx={thread.from.x}
                  cy={thread.from.y}
                  r={7}
                  className={styles.threadRing}
                />
              ) : (
                <circle
                  cx={thread.from.x}
                  cy={thread.from.y}
                  r={3.5}
                  className={styles.threadPin}
                />
              )}
            </g>
          ))}
        </svg>
      )}

      <div className={styles.answers}>
        <AnswerCard status="verified" />
        <AnswerCard status="unsure" />
        <AnswerCard status="not_found" />
      </div>
    </div>
  );
}

/**
 * Where the specimen's threads run, in its own coordinates. A passage is
 * marked as an editor would, with a bracket in the letter's right margin
 * beside its lines, and the thread leaves from there, so it never crosses
 * the words after the passage. The letter with no amount has nothing to
 * bracket: its thread starts at an empty ring on the letter's edge.
 */
function measureSpecimen(figure: HTMLElement): SpecimenThread[] {
  // Not shown (a phone): nothing to measure.
  if (!figure.offsetParent) return [];
  const box = figure.getBoundingClientRect();
  const sheet = figure.querySelector<HTMLElement>(`.${styles.sheet}`);
  const gap = figure.querySelector<HTMLElement>('[data-key="gap"]');
  if (!sheet || !gap) return [];
  const sheetBox = sheet.getBoundingClientRect();
  const marginX = sheetBox.right - box.left - 14;

  const towards = (status: FieldStatus): Point | null => {
    const card = figure.querySelector<HTMLElement>(`[data-status="${status}"]`);
    if (!card) return null;
    // Layout box, not the drawn one: the card may be part-way through moving.
    const r = card.getBoundingClientRect();
    const shift = new DOMMatrixReadOnly(getComputedStyle(card).transform).m42;
    return { x: r.left - box.left - 1, y: r.top - box.top - shift + card.offsetHeight / 2 };
  };
  // The lines a passage covers, which may be several marks in a row.
  const bracketFor = (keys: string[]) => {
    const lines = keys.flatMap((key) => {
      const mark = figure.querySelector(`mark[data-key="${key}"]`);
      return mark ? [...mark.getClientRects()].filter((r) => r.width > 0) : [];
    });
    if (!lines.length) return null;
    const top = Math.min(...lines.map((r) => r.top)) - box.top;
    const bottom = Math.max(...lines.map((r) => r.bottom)) - box.top;
    return { x: marginX, top, bottom };
  };

  const plan: Array<[string, FieldStatus, string[]]> = [
    ["verified", "verified", ["amount"]],
    ["unsure-pay", "unsure", ["amount", "due"]],
    ["unsure-form", "unsure", ["form"]],
  ];
  const threads: SpecimenThread[] = [];
  for (const [key, status, keys] of plan) {
    const bracket = bracketFor(keys);
    const to = towards(status);
    if (!bracket || !to) return [];
    const from = { x: bracket.x, y: (bracket.top + bracket.bottom) / 2 };
    threads.push({ key, status, from, to, bracket, d: threadPath(from, to) });
  }

  const gapBox = gap.getBoundingClientRect();
  const ring = {
    x: sheetBox.right - box.left,
    y: gapBox.top - box.top + gapBox.height * 0.3,
  };
  const toGap = towards("not_found");
  if (!toGap) return [];
  threads.push({
    key: "not-found",
    status: "not_found",
    from: ring,
    to: toGap,
    bracket: null,
    d: threadPath(ring, toGap),
  });
  return threads;
}

/** A phone's version: the lines of the letter that matter, and the answer. */
function Excerpt({ status }: { status: FieldStatus }) {
  return (
    <div className={styles.excerpt} data-status={status} aria-hidden="true">
      <p className={styles.slip}>
        {status === "verified" && (
          <>
            Your <mark>tuition balance of $1,250.00</mark> is due by November
            15, 2026.
          </>
        )}
        {status === "unsure" && (
          <>
            Your <mark>tuition balance of $1,250.00 is due by November 15, 2026</mark>
            . &hellip; To keep your award, please{" "}
            <mark>submit your signed verification form</mark> to the Office of
            Financial Aid.
          </>
        )}
        {status === "not_found" && (
          <>Your tuition balance is due by November 15, 2026.</>
        )}
      </p>
      <span className={styles.tie} />
      <AnswerCard status={status} />
    </div>
  );
}
