// owner: m
// Run with: npx tsx --test components/processing/ProcessingView.test.tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PROCESSING_STAGES } from "@/components/lib/client";
import {
  DROP_WHILE_WAITING,
  formatElapsed,
  LONG_WAIT_MESSAGE,
  LONG_WAIT_SECONDS,
  ProcessingView,
  STAGE_LABELS,
} from "./ProcessingView";

const FILE = "harborview-lease-renewal.pdf";
const EXPLANATION =
  "Unsealed is reading the text in your PDF and checking each answer against the letter’s own words. The whole letter is handled together, so your results will appear all at once.";
const KEEP_OPEN =
  "This can take a little while, and some letters take longer than others. Keep this page open; your results will appear here when they’re ready.";

const plain = (markup: string) =>
  markup
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

/** The markup without anything hidden from assistive technology. */
const withoutHidden = (markup: string) =>
  markup.replace(/<(\w+) aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/g, "");

const render = (props: Partial<Parameters<typeof ProcessingView>[0]> = {}) =>
  renderToStaticMarkup(<ProcessingView fileName={FILE} stage={null} onCancel={() => {}} {...props} />);

test("the live wait says what is known, and nothing it can't know", () => {
  const markup = render();
  const text = plain(markup);
  assert.match(text, /Going through your letter/);
  assert.match(text, /Working on your letter/);
  assert.ok(text.includes(EXPLANATION), "explanation unchanged");
  assert.ok(text.includes(KEEP_OPEN), "keep-open note unchanged");
  assert.match(markup, /role="timer"[^>]*>0 seconds</);
  assert.match(text, /Cancel/);
  // No invented progress: no percentages, bars, steps or promised times.
  assert.doesNotMatch(text, /%|\bstep\b|\bminute\b/i);
  assert.doesNotMatch(markup, /role="progressbar"|<progress|aria-valuenow|aria-current="step"/);
  for (const label of Object.values(STAGE_LABELS)) assert.ok(!text.includes(label), label);
});

test("the file being read is named in the text, not only on the picture", () => {
  const markup = render();
  assert.match(markup, new RegExp(`<p class="pw-file">${FILE}</p>`));
  // The letter on the desk repeats the name and is hidden from assistive technology.
  assert.match(markup, /<div aria-hidden="true" class="pw-letter">/);
  assert.equal(markup.split(FILE).length - 1, 2);
});

test("focus lands on the heading, and changes are announced politely", () => {
  const markup = render();
  assert.match(markup, /<h1 tabindex="-1" class="rw-title">Going through your letter<\/h1>/);
  assert.equal(markup.split('role="status"').length - 1, 3); // stage, long wait, dropped file
  // Before 30 seconds the long-wait message is nowhere a person or a screen
  // reader can find it; only its unseen, room-keeping copy exists.
  assert.ok(!withoutHidden(markup).includes(LONG_WAIT_MESSAGE), "the long-wait message waits its turn");
  assert.ok(!markup.includes(DROP_WHILE_WAITING), "the drop message only appears after a drop");
});

test("the long-wait message's room is kept from the start, unseen and unread", () => {
  const markup = render();
  const slot = markup.match(/<div class="pw-notice-slot">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(slot, "the slot is there before 30 seconds");
  // The copy has the message's exact words, so it takes exactly its room...
  assert.match(slot, new RegExp(`^<p aria-hidden="true" class="pw-long-wait pw-reserve">${LONG_WAIT_MESSAGE}</p>`));
  // ...and the live region shares the slot, empty until the wait is long.
  assert.match(slot, /<p role="status" class=""><\/p>$/);
  // A prepared sample has no timer, so no slot.
  assert.doesNotMatch(render({ prepared: true }), /pw-notice-slot|pw-reserve/);
});

test("a dropped file's message sits in the page after Cancel, never floating over it", () => {
  const markup = render();
  assert.match(markup, /<div role="status" class="pw-drop-note"><\/div>/);
  assert.doesNotMatch(markup, /rw-drop-note/);
  assert.ok(markup.indexOf(">Cancel<") < markup.indexOf("pw-drop-note"), "after Cancel");
});

test("stages are listed only when the service reports them", () => {
  const markup = render({ stage: "verifying" });
  const text = plain(markup);
  for (const name of PROCESSING_STAGES) assert.ok(text.includes(STAGE_LABELS[name]), name);
  assert.match(markup, /aria-current="step"[^>]*>.*Verifying evidence/);
  assert.equal(markup.split('aria-current="step"').length - 1, 1);
});

test("a prepared sample says no analysis is being run and shows no timer", () => {
  const markup = render({ prepared: true });
  const text = plain(markup);
  assert.match(text, /Opening prepared sample/);
  assert.match(text, /This sample was prepared in advance\. No analysis is being run\./);
  assert.doesNotMatch(markup, /role="timer"/);
  assert.ok(!text.includes(KEEP_OPEN));
  assert.match(text, /Cancel/);
});

test("elapsed time reads naturally, and the long wait starts at 30 seconds", () => {
  assert.equal(formatElapsed(0), "0 seconds");
  assert.equal(formatElapsed(1), "1 second");
  assert.equal(formatElapsed(61), "1 minute 1 second");
  assert.equal(formatElapsed(300), "5 minutes 0 seconds");
  assert.equal(LONG_WAIT_SECONDS, 30);
  assert.equal(LONG_WAIT_MESSAGE, "This is taking longer than expected. You can keep waiting or cancel.");
});
