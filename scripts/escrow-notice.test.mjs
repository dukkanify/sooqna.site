/**
 * Negative «بدون ضمان مالي» notice must never render on regular listings.
 * Run: npm test
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

describe("no-escrow intermediary notice", () => {
  it("forces showsNonEscrowIntermediaryNotice to always return false", () => {
    const src = read("shared/listings/escrow-eligibility.ts");
    assert.match(
      src,
      /export function showsNonEscrowIntermediaryNotice\([^)]*\):\s*boolean \{\s*return false;/,
      "negative no-escrow notice helper must always return false",
    );
  });

  it("ListingPlatformNotice does not render the Arabic no-escrow banner", () => {
    const src = read("features/listings/components/ListingPlatformNotice.tsx");
    assert.doesNotMatch(
      src,
      /إعلان عادي — بدون ضمان مالي/,
      "banner title must not remain in the notice component",
    );
    assert.match(src, /return null/);
  });
});
