// owner: m
"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  DocumentPanel,
  type EvidenceFocus,
} from "@/components/document/DocumentPanel";
import {
  passageInContext,
  type LetterMark,
} from "@/components/document/letterMarks";
import { useFocusOnMount } from "@/components/hooks/useFocusOnMount";
import {
  resolveCitation,
  verifiedConflicts,
  type TextRange,
} from "@/components/lib/citation";
import { displayStatus, FIELD_META } from "@/components/lib/fields";
import { Button } from "@/components/ui/Button";
import { ChevronIcon } from "@/components/ui/icons";
import {
  FIELD_NAMES,
  type AnalysisResult,
  type FieldName,
} from "@/lib/schema";
import {
  CheckUnavailableNotice,
  isCheckUnavailable,
} from "./CheckUnavailableNotice";
import { ConflictWarnings, type ConflictSelection } from "./ConflictWarnings";
import { useResultsDropGuard } from "./dropGuard";
import { EvidenceThreads, type ThreadTone } from "./EvidenceThreads";
import { FieldCard } from "./FieldCard";
import { VerificationOverview } from "./VerificationOverview";

/** Where "Jump to the four answers" lands. */
const ANSWERS_ID = "the-four-answers";

// Short figures get display type; sentences get reading type.
const PROMINENT_FIELDS: ReadonlySet<FieldName> = new Set([
  "amountOwed",
  "deadline",
]);

/** The one thing being shown in the letter: an answer's quote or a passage. */
type Shown =
  | { kind: "field"; name: FieldName }
  | ({ kind: "conflict" } & ConflictSelection);

interface ResultsViewProps {
  result: AnalysisResult;
  /** What to call the letter in the panel beside the answers. */
  letterName: string;
  /** Shown above the answers, e.g. when they are canned data. */
  notice?: ReactNode;
  onStartOver: () => void;
}

/**
 * The results: what the letter is and means, any warnings, the four answers,
 * and the letter itself beside them. Choosing an answer's evidence marks its
 * passage in the letter and, where the two sit side by side, ties them with
 * a thread. Only passages confirmed by `resolveCitation` are ever marked.
 */
export function ResultsView({
  result,
  letterName,
  notice,
  onStartOver,
}: ResultsViewProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const refusingDrop = useResultsDropGuard();
  const conflicts = verifiedConflicts(result);
  const checkUnavailable = isCheckUnavailable(result);

  function rangeOf(name: FieldName): TextRange | null {
    const { citation } = result.fields[name];
    return citation ? resolveCitation(result.documentText, citation) : null;
  }

  function letterFocus(): EvidenceFocus | null {
    if (shown?.kind === "field") {
      return {
        kind: "claim",
        claim: FIELD_META[shown.name].name,
        range: rangeOf(shown.name),
      };
    }
    if (shown?.kind === "conflict") {
      return {
        kind: "conflict",
        position: shown.side === 0 ? 1 : 2,
        range: conflicts[shown.index].passages[shown.side].range,
      };
    }
    return null;
  }

  /**
   * What the letter marks. Inspecting a conflict shows its two passages,
   * numbered as in the warning, and nothing else. Otherwise every answer's
   * confirmed passage is underlined, and the chosen one is highlighted.
   */
  function letterMarks(): LetterMark[] {
    if (shown?.kind === "conflict") {
      return conflicts[shown.index].passages.map((passage, side) => ({
        range: passage.range,
        tone: side === shown.side ? "active" : "related",
        tag: String(side + 1),
      }));
    }
    const marks: LetterMark[] = [];
    for (const name of FIELD_NAMES) {
      const status = displayStatus(result.fields[name]);
      const range = rangeOf(name);
      if (status === "not_found" || !range) continue;
      const chosen = shown?.kind === "field" && shown.name === name;
      marks.push({ range, tone: chosen ? "active" : "resting", status });
    }
    return marks;
  }

  // A thread is only drawn to a passage the letter is confirmed to hold.
  let threadKey: string | null = null;
  let threadTone: ThreadTone = "verified";
  if (shown?.kind === "field" && rangeOf(shown.name)) {
    threadKey = `field-${shown.name}`;
    threadTone =
      displayStatus(result.fields[shown.name]) === "verified"
        ? "verified"
        : "unsure";
  } else if (shown?.kind === "conflict") {
    threadKey = `conflict-${shown.index}-${shown.side}`;
    threadTone = "conflict";
  }

  return (
    <div className="rw-results">
      <div className="mx-auto w-full max-w-[90rem] px-5 pt-4 pb-20 sm:px-8 lg:pt-8">
        {notice && <p className="rw-slip rw-preview-notice">{notice}</p>}

        <div ref={workspaceRef} className="rw-workspace">
          <div className="rw-main break-words">
            <p className="rw-eyebrow">
              <span aria-hidden="true" className="eyebrow-rule" />
              Type of letter
            </p>
            <h1 ref={headingRef} tabIndex={-1} className="rw-title">
              {result.documentType}
            </h1>

            <h2 className="mt-7 text-base font-semibold tracking-wide text-cyan-ink">
              What does this letter mean?
            </h2>
            <p className="rw-summary">{result.summary}</p>

            <div className="mt-8 space-y-4">
              {/* Where the page is one column, several conflicts stand between
                  the summary and the answers. This only skips ahead; the
                  warnings stay first and whole. */}
              {conflicts.length > 1 && (
                <p className="lg:hidden">
                  <a
                    href={`#${ANSWERS_ID}`}
                    className="rw-link-on-desk inline-flex items-center gap-1 py-1"
                  >
                    Jump to the four answers
                    <ChevronIcon direction="down" width={18} height={18} />
                  </a>
                </p>
              )}
              <ConflictWarnings
                conflicts={conflicts}
                active={shown?.kind === "conflict" ? shown : null}
                onSelect={(selection) =>
                  setShown(selection && { kind: "conflict", ...selection })
                }
              />
              {checkUnavailable && <CheckUnavailableNotice />}
              <VerificationOverview
                result={result}
                possibleConflict={conflicts.length > 0}
                checkUnavailable={checkUnavailable}
              />
            </div>

            <p
              id={ANSWERS_ID}
              tabIndex={-1}
              className="rw-eyebrow mt-10 scroll-mt-6"
            >
              <span aria-hidden="true" className="eyebrow-rule" />
              The four answers
            </p>
            <div className="@container mt-4">
              <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
                {FIELD_NAMES.map((name) => {
                  const prominent = PROMINENT_FIELDS.has(name);
                  const range = rangeOf(name);
                  return (
                    <div key={name} className={prominent ? "" : "@2xl:col-span-2"}>
                      <FieldCard
                        name={name}
                        field={result.fields[name]}
                        prominent={prominent}
                        isOpen={shown?.kind === "field" && shown.name === name}
                        located={range !== null}
                        context={
                          range ? passageInContext(result.documentText, range) : null
                        }
                        onToggle={(open) =>
                          setShown(open ? { kind: "field", name } : null)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {result.disclaimer && (
              <p className="mt-8 max-w-2xl text-sm text-fog">{result.disclaimer}</p>
            )}

            <Button variant="secondary" onClick={onStartOver} className="mt-6">
              Read another letter
            </Button>
          </div>

          <aside className="rw-aside">
            <DocumentPanel
              documentText={result.documentText}
              letterName={letterName}
              focus={letterFocus()}
              marks={letterMarks()}
            />
          </aside>

          <EvidenceThreads
            containerRef={workspaceRef}
            selectionKey={threadKey}
            tone={threadTone}
          />
        </div>
      </div>

      {/* Always present, so the message is announced when it appears. */}
      <div role="status" className="rw-drop-note" data-on={refusingDrop ? "" : undefined}>
        {refusingDrop && (
          <>
            A file dropped here isn&rsquo;t opened, so these results stay put.
            To read another letter, choose &ldquo;Read another letter&rdquo;.
          </>
        )}
      </div>
    </div>
  );
}
