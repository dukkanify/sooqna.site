/**
 * Marketplace browse cards stay photo-first and dense:
 * no action chips on the cover, no stretch gaps, one meta line under price.
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

describe("listing card photo clarity", () => {
  it("PremiumListingCard keeps the cover clear of actions and escrow pills", () => {
    const card = read("features/listings/components/PremiumListingCard.tsx");
    assert.match(card, /marketplace-card-crown/);
    assert.doesNotMatch(card, /marketplace-card-media-actions/);
    assert.doesNotMatch(card, /card-media-action/);
    assert.doesNotMatch(card, /FavoriteButton/);
    assert.doesNotMatch(card, /CardShareButton/);
    assert.doesNotMatch(card, /Badge variant="escrow"/);
    assert.match(card, /ضمان مالي/);
  });

  it("PremiumListingCard packs a dense body without stretch gaps", () => {
    const card = read("features/listings/components/PremiumListingCard.tsx");
    const css = read("app/globals.css");
    assert.doesNotMatch(card, /mt-auto/);
    assert.match(card, /self-start/);
    assert.match(card, /line-clamp-2/);
    assert.doesNotMatch(card, /flex h-full flex-col/);
    assert.match(card, /·/);
    assert.match(css, /contain-intrinsic-size:\s*auto 14rem/);
  });

  it("MobileFeaturedCard favorite control sits in the body, not on the cover", () => {
    const mobile = read(
      "features/home/components/mobile/MobileFeaturedCard.tsx",
    );
    assert.match(mobile, /mobile-home-featured-card__crown/);
    assert.match(mobile, /mobile-home-featured-card__footer/);
    assert.doesNotMatch(mobile, /card-media-action/);
    assert.match(mobile, /FavoriteButton/);
  });
});
