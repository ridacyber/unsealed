// owner: m
"use client";

import { useId, type MouseEvent } from "react";
import { quoteOf } from "@/components/lib/citation";
import { displayStatus, FIELD_META } from "@/components/lib/fields";
import { ChevronIcon } from "@/components/ui/icons";
import type { Field, FieldName, FieldStatus } from "@/lib/schema";
import { Evidence } from "./Evidence";
import { StatusBadge } from "./StatusBadge";

// Figures up to this length ("12 October 2026") fit on one line at full size.
const SHORT_VALUE_LENGTH = 20;

const UNSURE_HEADLINE = "We couldn't confirm this";
const NOT_FOUND_HEADLINE = "The letter doesn't say";

const SHELLS: Record<FieldStatus, string> = {
  verified: "border border-line bg-sheet",
  unsure: "border border-unsure-line bg-unsure-tint pl-3",
  not_found: "border-2 border-dashed border-missing-line bg-missing-tint",
};

/** A note worth showing: present, and more than the headline repeated. */
function addsTo(headline: string, note: string | null): note is string {
  if (!note?.trim()) return false;
  const plain = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return plain(note) !== plain(headline);
}

interface FieldCardProps {
  name: FieldName;
  field: Field;
  /** Larger type for short figures such as an amount or a date. */
  prominent?: boolean;
  /** Whether this card's evidence is the one being shown. */
  isOpen: boolean;
  /** Whether the quote's place in the letter is known. */
  located: boolean;
  onToggle: (open: boolean) => void;
}

export function FieldCard({
  name,
  field,
  prominent = false,
  isOpen,
  located,
  onToggle,
}: FieldCardProps) {
  const headingId = useId();
  const evidenceId = useId();
  const status = displayStatus(field);
  const { question, name: claim } = FIELD_META[name];
  const quote = status === "not_found" ? null : quoteOf(field.citation);
  const value = field.value ?? "";

  // Clicking anywhere on the claim opens its evidence. The button below is
  // the keyboard and screen-reader route to the same thing.
  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (isOpen || !quote) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    if (window.getSelection()?.toString()) return;
    onToggle(true);
  }

  return (
    <article
      aria-labelledby={headingId}
      data-status={status}
      onClick={handleCardClick}
      className={`relative overflow-hidden rounded-xl p-5 transition-shadow sm:p-6 ${SHELLS[status]} ${
        isOpen ? "ring-2 ring-postal" : ""
      } ${quote && !isOpen ? "cursor-pointer hover:shadow-md" : ""}`}
    >
      {status === "unsure" && (
        <span
          aria-hidden="true"
          className="unsure-band absolute inset-y-0 left-0 w-2"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 id={headingId} className="text-lg font-semibold text-ink-soft">
          {question}
        </h2>
        <StatusBadge status={status} />
      </div>

      {status === "verified" && (
        <p
          className={
            prominent && value.length <= SHORT_VALUE_LENGTH
              ? "mt-3 font-display text-4xl leading-tight font-semibold"
              : prominent
                ? "mt-3 font-display text-2xl leading-snug font-semibold text-balance"
                : "mt-3 text-xl leading-relaxed"
          }
        >
          {value}
        </p>
      )}

      {/* An unconfirmed value is never shown: the note and the letter's own
          words stand in for it. */}
      {status === "unsure" && (
        <>
          <p className="mt-3 text-xl font-semibold text-unsure">
            {UNSURE_HEADLINE}
          </p>
          <p className="mt-2 text-lg leading-relaxed">
            {addsTo(UNSURE_HEADLINE, field.note)
              ? field.note
              : `Unsealed found something about ${claim} but couldn't confirm it, so no answer is given here. Check the letter itself, or ask the sender.`}
          </p>
        </>
      )}

      {status === "not_found" && (
        <>
          <p className="mt-3 text-xl font-semibold text-missing">
            {NOT_FOUND_HEADLINE}
          </p>
          <p className="mt-2 text-lg leading-relaxed">
            {addsTo(NOT_FOUND_HEADLINE, field.note)
              ? field.note
              : `Unsealed found nothing about ${claim} in this letter, so this is left blank rather than guessed.`}
          </p>
        </>
      )}

      {quote && (
        <>
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={evidenceId}
            onClick={() => onToggle(!isOpen)}
            className="mt-4 inline-flex min-h-11 items-center gap-1 font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal"
          >
            {!located
              ? "Show the unmatched quote"
              : status === "verified"
                ? "Where the letter says this"
                : "What the letter says"}
            <ChevronIcon
              direction={isOpen ? "up" : "down"}
              width={18}
              height={18}
            />
          </button>
          <div id={evidenceId} hidden={!isOpen}>
            {isOpen && <Evidence quote={quote} located={located} />}
          </div>
        </>
      )}
    </article>
  );
}
//writing this so i can push it to git after a test