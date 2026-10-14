/**
 * Desktop home rails — title/eyebrow/CTA only (no policy blurbs).
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

describe("home rail headers stay lean", () => {
  it("featured and nearby omit package / dedupe blurbs", () => {
    const featured = read(
      "features/home/components/marketplace/MarketFeatured.tsx",
    );
    const nearby = read(
      "features/home/components/marketplace/MarketNearbySection.tsx",
    );
    assert.doesNotMatch(featured, /description=/);
    assert.doesNotMatch(featured, /باقة التمييز/);
    assert.doesNotMatch(nearby, /description=/);
    assert.doesNotMatch(nearby, /بلا تكرار/);
  });

  it("category rails do not render section descriptions", () => {
    const section = read(
      "features/home/components/marketplace/MarketCategorySection.tsx",
    );
    assert.doesNotMatch(section, /description/);
    const feed = read("services/listings/home-feed.ts");
    assert.match(feed, /description: ""/);
    assert.doesNotMatch(feed, /بدون تكرار مع المميزة/);
  });

  it("keeps escrow explainer copy (not a listing rail)", () => {
    const escrow = read(
      "features/home/components/marketplace/MarketEscrow.tsx",
    );
    assert.match(escrow, /description=/);
  });
});
