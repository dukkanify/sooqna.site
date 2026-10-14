/**
 * Featured page should stay light — title + count + actions, no policy essay.
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

describe("featured page UI", () => {
  it("drops long summary and rule chips from the browse header", () => {
    const src = read("features/featured/FeaturedListingsView.tsx");
    assert.match(src, /إعلانات مميزة|copy\.title/);
    assert.match(src, /listingCountLabel/);
    assert.match(src, /ميّز إعلانك/);
    assert.doesNotMatch(src, /featuredPageRuleLabels/);
    assert.doesNotMatch(src, /copy\.summary/);
    assert.doesNotMatch(src, /copy\.eyebrow/);
    assert.doesNotMatch(src, /الضمان المالي/);
    assert.doesNotMatch(src, /أفضل العروض/);
  });
});
