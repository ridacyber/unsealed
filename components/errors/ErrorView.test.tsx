// owner: m
// Run with: npx tsx --test components/errors/ErrorView.test.tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { AnalysisErrorCode } from "@/components/lib/errors";
import {
  DROP_ON_ERROR,
  ERROR_COPY,
  ERROR_KIND,
  ERROR_KIND_LABEL,
  ErrorView,
  RETRY_NOTE,
} from "./ErrorView";

const FILE = "harborview-lease-renewal.pdf";

/** The wording of every failure as it stood before Phase 3. It must not drift. */
const BEFORE: Record<AnalysisErrorCode, { title: string; body: string; canRetry: boolean }> = {
  upload_failed: {
    title: "The connection failed",
    body: "We couldn't retrieve your analysis results. Check your connection before trying again. The request may have continued processing.",
    canRetry: true,
  },
  invalid_file: {
    title: "This file can't be used",
    body: "Unsealed reads PDF files up to 4 MB. This one is empty, too large, or isn't really a PDF. Choose a PDF copy of your letter.",
    canRetry: false,
  },
  file_too_large: {
    title: "This file is too large to send",
    body: "Unsealed reads PDF files up to 4 MB. Choose a smaller PDF copy of your letter, or save the letter again at a lower quality.",
    canRetry: false,
  },
  unreadable: {
    title: "We couldn't open this PDF",
    body: "The file may be damaged or password-protected. Try downloading or saving the letter again, then choose the new file.",
    canRetry: false,
  },
  no_text: {
    title: "This PDF has no text we can read",
    body: "It looks like a scan or photo of the pages saved as a PDF. Unsealed reads the text inside a PDF and can't read pictures of text. If you have the original digital copy of the letter, try that instead.",
    canRetry: false,
  },
  too_long: {
    title: "This letter is too long",
    body: "Unsealed can only read shorter letters for now. If the PDF holds several documents, try one with just the letter.",
    canRetry: false,
  },
  timed_out: {
    title: "That took longer than expected",
    body: "We stopped before your letter was finished, so there are no results to show. This is usually temporary and not a problem with your file. Please try again in a moment.",
    canRetry: true,
  },
  processing_failed: {
    title: "Your letter wasn't analyzed",
    body: "Something went wrong on our side. Try again in a moment. If it keeps happening, try a different copy of the letter.",
    canRetry: true,
  },
};

const CODES = Object.keys(BEFORE) as AnalysisErrorCode[];

const plain = (markup: string) =>
  markup
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const render = (code: AnalysisErrorCode) =>
  renderToStaticMarkup(<ErrorView code={code} fileName={FILE} onRetry={() => {}} onStartOver={() => {}} />);

test("every failure keeps its wording and its retry rule", () => {
  assert.deepEqual(ERROR_COPY, BEFORE);
});

test("each failure is shown with its own title, explanation and the file's name", () => {
  for (const code of CODES) {
    const markup = render(code);
    const text = plain(markup);
    assert.match(markup, new RegExp(`<h1 tabindex="-1" class="rw-title">${BEFORE[code].title.replace(/'/g, "&#x27;")}</h1>`), code);
    assert.ok(text.includes(BEFORE[code].body), code);
    assert.ok(text.includes(`File: ${FILE}`), code);
    assert.ok(text.includes(ERROR_KIND_LABEL[ERROR_KIND[code]]), code);
  }
});

test("Try again is offered only where retrying can help, and says what it does", () => {
  for (const code of CODES) {
    const markup = render(code);
    const text = plain(markup);
    const tryAgain = text.split("Try again").length - 1;
    // "Try again" also appears inside some explanations ("Try again in a moment").
    const inBody = BEFORE[code].body.split("Try again").length - 1;
    assert.equal(tryAgain - inBody, BEFORE[code].canRetry ? 1 : 0, code);
    assert.equal(text.includes(RETRY_NOTE), BEFORE[code].canRetry, code);
    assert.equal(text.split("Choose a different file").length - 1, 1, code);
    if (BEFORE[code].canRetry) {
      const id = markup.match(/aria-describedby="([^"]+)"[^>]*>Try again</)?.[1];
      assert.ok(id && markup.includes(`id="${id}"`), `${code}: the note describes the button`);
    }
  }
});

test("the kind of failure is never mixed up: file problems aren't called temporary", () => {
  assert.deepEqual(
    CODES.filter((code) => ERROR_KIND[code] === "file").sort(),
    ["file_too_large", "invalid_file", "no_text", "too_long", "unreadable"],
  );
  assert.equal(ERROR_KIND.upload_failed, "connection");
  assert.equal(ERROR_KIND.timed_out, "time");
  assert.equal(ERROR_KIND.processing_failed, "service");
});

test("a dropped file's message sits in the page after the actions, never over them", () => {
  for (const code of CODES) {
    const markup = render(code);
    assert.match(markup, /<div role="status" class="pw-drop-note"><\/div>/, code);
    assert.doesNotMatch(markup, /rw-drop-note/, code);
    assert.ok(markup.indexOf("Choose a different file") < markup.indexOf("pw-drop-note"), code);
  }
});

test("the returned letter is decoration, and nothing says the analysis restarted", () => {
  for (const code of CODES) {
    const markup = render(code);
    assert.match(markup, /<div aria-hidden="true" class="pw-letter" data-returned=""/, code);
    assert.doesNotMatch(plain(markup), /restart|retrying|trying again now/i, code);
    assert.ok(!markup.includes(DROP_ON_ERROR), code);
  }
});
