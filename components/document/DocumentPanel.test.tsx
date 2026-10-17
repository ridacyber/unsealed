// owner: m
// Run with: npx tsx --test components/document/DocumentPanel.test.tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentPanel, overflows } from "./DocumentPanel";

const box = (scrollHeight: number, clientHeight: number, scrollWidth = 300, clientWidth = 300) => ({
  scrollHeight,
  clientHeight,
  scrollWidth,
  clientWidth,
});

test("a letter taller than its window can be scrolled", () => {
  assert.equal(overflows(box(1200, 600)), true);
});

test("a letter wider than its window can be scrolled", () => {
  assert.equal(overflows(box(600, 600, 420, 300)), true);
});

test("a letter that fits its window has nothing to scroll", () => {
  assert.equal(overflows(box(600, 600)), false);
  assert.equal(overflows(box(400, 600)), false);
});

test("the letter is not a tab stop before it is known to scroll", () => {
  const html = renderToStaticMarkup(
    <DocumentPanel
      documentText={"Dear Student,\nYour balance is $10.00."}
      letterName="Test letter"
      focus={null}
      marks={[]}
    />,
  );
  const scroller = html.match(/<div[^>]*data-letter-scroller[^>]*>/)?.[0];
  assert.ok(scroller, "the letter's scrolling window is rendered");
  assert.doesNotMatch(scroller, /tabindex|role=|aria-label/);
  assert.match(html, /<section[^>]*aria-labelledby="letter-heading"/);
});
