/**
 * Marketplace card photos must stay clear of action chips and escrow badges —
 * favorite/share/escrow live in the card body so the cover stays readable.
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
  it("PremiumListingCard keeps favorite, share, badges, and escrow off the photo", () => {
    const card = read("features/listings/components/PremiumListingCard.tsx");
    // Photo may still host the live Featured crown only.
    assert.match(card, /marketplace-card-crown/);
    assert.doesNotMatch(card, /marketplace-card-media-actions/);
    assert.doesNotMatch(card, /card-media-action/);
    assert.match(card, /marketplace-card-body-actions/);
    assert.match(card, /tone="ghost"/);
    assert.match(card, /inline/);
    assert.match(card, /Badge variant="escrow"/);
    // Escrow badge must not be absolutely positioned on the media.
    assert.doesNotMatch(
      card,
      /absolute bottom-3 start-3[\s\S]{0,80}ضمان مالي/,
    );
  });

  it("PremiumListingCard packs body tightly without stretch gaps or harsh title clip", () => {
    const card = read("features/listings/components/PremiumListingCard.tsx");
    const css = read("app/globals.css");
    assert.doesNotMatch(card, /mt-auto/);
    assert.match(card, /self-start/);
    assert.match(card, /line-clamp-3/);
    assert.doesNotMatch(card, /flex h-full flex-col/);
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
