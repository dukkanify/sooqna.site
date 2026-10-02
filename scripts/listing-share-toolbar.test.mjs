/**
 * Listing detail share control — familiar ghost toolbar + export icon.
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
  it("ShareButton supports ghost meta-action variant", () => {
    const src = read("shared/components/ShareButton.tsx");
    assert.match(src, /variant\?: "chip" \| "ghost"/);
    assert.match(src, /ghostClass/);
    assert.match(src, /name=\{iconOnly \? "share-2" : "share"\}/);
  });

  it("listing detail toolbar uses ghost share action", () => {
    const src = read("features/listings/components/ListingDetailToolbar.tsx");
    assert.match(src, /variant="ghost"/);
    assert.match(src, /listing-detail-toolbar/);
  });

  it("share icon uses export arrow; share-2 keeps nodes overlay", () => {
    const src = read("shared/ui/Icon.tsx");
    assert.match(src, /name === "share-2"/);
    assert.doesNotMatch(src, /name === "share" \|\| name === "share-2"/);
    assert.match(src, /ShareNodes/);
  });
});
