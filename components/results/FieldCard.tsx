// owner: m
"use client";

import { useId, type MouseEvent } from "react";
import type { PassageInContext } from "@/components/document/letterMarks";
import { quoteOf } from "@/components/lib/citation";
import {
  displayStatus,
  FIELD_META,
  shownStatus,
} from "@/components/lib/fields";
import { ChevronIcon } from "@/components/ui/icons";
import type { Field, FieldName } from "@/lib/schema";
import { Evidence } from "./Evidence";
import { StatusBadge } from "./StatusBadge";

// Figures up to this length ("12 October 2026") fit on one line at full size.
const SHORT_VALUE_LENGTH = 20;

const UNSURE_HEADLINE = "We couldn't confirm this";
const NOT_FOUND_HEADLINE = "The letter doesn't say";

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
  /** The located passage with a little of the letter around it. */
  context?: PassageInContext | null;
  onToggle: (open: boolean) => void;
}

/**
 * One of the four answers, on a card of its own. Its state is said in words
 * and shown by its badge, its border and its shape, never by colour alone:
 * a verified answer is printed; an unsure one is striped and gives no value;
 * a missing one is a dashed gap that says so.
 */
export function FieldCard({
  name,
  field,
  prominent = false,
  isOpen,
  located,
  context,
  onToggle,
}: FieldCardProps) {
  const headingId = useId();
  const evidenceId = useId();
  const status = shownStatus(field, located);
  // Reported as verified, but with no quote found in the letter to show for it.
  const heldBack = status !== displayStatus(field);
  const { question, name: claim, notFound } = FIELD_META[name];
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
      data-field={name}
      data-open={isOpen ? "" : undefined}
      data-clickable={quote && !isOpen ? "" : undefined}
      // The thread to the letter starts here, and only for a passage the
      // letter has been confirmed to hold. A missing answer has no quote, so
      // it never points into the letter, whatever citation came with it.
      data-evidence-source={isOpen && located && quote ? "" : undefined}
      onClick={handleCardClick}
      className="rw-card"
    >
      {status === "unsure" && (
        <span aria-hidden="true" className="unsure-band rw-card-band" />
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 id={headingId} className="rw-card-question">
          {question}
        </h2>
        <StatusBadge status={status} />
      </div>

      {status === "verified" && (
        <p
          className={
            prominent && value.length <= SHORT_VALUE_LENGTH
              ? "rw-card-value rw-card-value-figure"
              : prominent
                ? "rw-card-value rw-card-value-long"
                : "rw-card-value rw-card-value-sentence"
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
          <p className="mt-2 text-[1.05rem] leading-relaxed">
            {heldBack
              ? quote
                ? "Unsealed couldn't match the quote behind this answer to the text it read from your letter, so it isn't shown as verified and no answer is given here. Check the letter itself, or ask the sender."
                : "No quote from your letter came with this answer, so it isn't shown as verified and no answer is given here. Check the letter itself, or ask the sender."
              : addsTo(UNSURE_HEADLINE, field.note)
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
          <p className="mt-2 text-[1.05rem] leading-relaxed">
            {addsTo(NOT_FOUND_HEADLINE, field.note) ? field.note : notFound}
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
            className="rw-evidence-toggle"
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
            {isOpen && (
              <Evidence quote={quote} located={located} context={context} />
            )}
          </div>
        </>
      )}

      {isOpen && located && quote && (
        <span aria-hidden="true" className="rw-card-pin" />
      )}
    </article>
  );
}
