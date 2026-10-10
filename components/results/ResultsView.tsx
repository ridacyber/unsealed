// owner: m
"use client";

import { useState, type ReactNode } from "react";
import { DocumentPanel } from "@/components/document/DocumentPanel";
import { useFocusOnMount } from "@/components/hooks/useFocusOnMount";
import { resolveCitation, type TextRange } from "@/components/lib/citation";
import { FIELD_META } from "@/components/lib/fields";
import { Button } from "@/components/ui/Button";
import {
  FIELD_NAMES,
  type AnalysisResult,
  type FieldName,
} from "@/lib/schema";
import { FieldCard } from "./FieldCard";
import { VerificationOverview } from "./VerificationOverview";

// Short figures get display type; sentences get reading type.
const PROMINENT_FIELDS: ReadonlySet<FieldName> = new Set([
  "amountOwed",
  "deadline",
]);

interface ResultsViewProps {
  result: AnalysisResult;
  /** What to call the letter in the panel beside the answers. */
  letterName: string;
  /** Shown above the answers, e.g. when they are canned data. */
  notice?: ReactNode;
  onStartOver: () => void;
}

export function ResultsView({
  result,
  letterName,
  notice,
  onStartOver,
}: ResultsViewProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const [openField, setOpenField] = useState<FieldName | null>(null);

  function rangeOf(name: FieldName): TextRange | null {
    const { citation } = result.fields[name];
    return citation ? resolveCitation(result.documentText, citation) : null;
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] px-5 pt-6 pb-20 sm:px-8 lg:pt-10">
      {notice && (
        <p className="mb-8 rounded-xl border border-line bg-sheet p-4">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:gap-14">
        <div className="break-words">
          <p className="text-sm font-semibold tracking-widest text-ink-soft uppercase">
            Type of letter
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl"
          >
            {result.documentType}
          </h1>

          <h2 className="mt-8 text-lg font-semibold text-ink-soft">
            What does this letter mean?
          </h2>
          <p className="mt-2 max-w-2xl text-xl leading-relaxed">
            {result.summary}
          </p>

          <div className="mt-8">
            <VerificationOverview result={result} />
          </div>

          <div className="@container mt-6">
            <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
              {FIELD_NAMES.map((name) => {
                const prominent = PROMINENT_FIELDS.has(name);
                return (
                  <div key={name} className={prominent ? "" : "@2xl:col-span-2"}>
                    <FieldCard
                      name={name}
                      field={result.fields[name]}
                      prominent={prominent}
                      isOpen={openField === name}
                      located={rangeOf(name) !== null}
                      onToggle={(open) => setOpenField(open ? name : null)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {result.disclaimer && (
            <p className="mt-6 max-w-2xl text-sm text-ink-soft">
              {result.disclaimer}
            </p>
          )}

          <Button variant="secondary" onClick={onStartOver} className="mt-8">
            Read another letter
          </Button>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <DocumentPanel
            documentText={result.documentText}
            letterName={letterName}
            focus={
              openField && {
                claim: FIELD_META[openField].name,
                range: rangeOf(openField),
              }
            }
          />
        </aside>
      </div>
    </div>
  );
}
