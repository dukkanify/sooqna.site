/**
 * Listing share control — familiar ghost/export icon app-wide.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("listing share toolbar design", () => {
  it("ShareButton defaults to ghost and supports panel", () => {
    const src = read("shared/components/ShareButton.tsx");
    assert.match(src, /variant\?: "ghost" \| "panel" \| "chip"/);
    assert.match(src, /variant = "ghost"/);
    assert.match(src, /ghostClass/);
    assert.match(src, /panelClass/);
    assert.match(src, /name="share"/);
    assert.doesNotMatch(src, /name=\{iconOnly \? "share-2"/);
  });

  it("listing detail toolbar uses ghost share action", () => {
    const src = read("features/listings/components/ListingDetailToolbar.tsx");
    assert.match(src, /variant="ghost"/);
    assert.match(src, /listing-detail-toolbar/);
  });

  it("summary and sticky panel use panel share variant", () => {
    const summary = read("features/listings/components/ListingSummary.tsx");
    const sticky = read("features/listings/components/ListingStickyPanel.tsx");
    assert.match(summary, /variant="panel"/);
    assert.match(sticky, /variant="panel"/);
  });

  it("card share uses export share icon", () => {
    const src = read("shared/components/CardShareButton.tsx");
    assert.match(src, /name="share"/);
    assert.doesNotMatch(src, /name="share-2"/);
  });

  it("share icon uses export arrow; share-2 keeps nodes overlay", () => {
    const src = read("shared/ui/Icon.tsx");
    assert.match(src, /name === "share-2"/);
    assert.doesNotMatch(src, /name === "share" \|\| name === "share-2"/);
    assert.match(src, /ShareNodes/);
  });
});
