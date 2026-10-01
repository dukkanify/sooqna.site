/**
 * Featured badge — gold cap above the ad (never overlaps photo badges).
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("featured badge design", () => {
  it("FeaturedBadge supports above-ad cap placement", () => {
    const badge = read("features/listings/components/FeaturedBadge.tsx");
    const css = read("features/listings/components/featured-badge.css");
    assert.match(badge, /placement\?:\s*"cap"\s*\|\s*"chip"/);
    assert.match(badge, /listing-featured-badge--cap/);
    assert.match(badge, /مميّز/);
    assert.match(badge, /name="star"/);
    assert.match(css, /listing-featured-badge--cap/);
    assert.match(css, /listing-featured-sheen/);
    assert.doesNotMatch(css, /rotate\(-45deg\)/);
    assert.doesNotMatch(css, /listing-featured-badge--corner/);
  });

  it("cards overlay Featured on the photo only when live — no empty crown gap", () => {
    const card = read("features/listings/components/PremiumListingCard.tsx");
    const badges = read("features/listings/components/ListingCardBadges.tsx");
    const mobile = read("features/home/components/mobile/MobileFeaturedCard.tsx");
    const css = read("features/listings/components/featured-badge.css");
    const skeleton = read("shared/ui/Skeleton.tsx");
    assert.match(card, /placement="cap"/);
    assert.match(card, /excludeFeatured/);
    assert.match(card, /marketplace-card--featured/);
    assert.match(card, /marketplace-card-crown/);
    assert.match(card, /featuredLive \? \(/);
    assert.match(badges, /excludeFeatured/);
    assert.match(mobile, /placement="cap"/);
    assert.match(mobile, /excludeFeatured/);
    assert.match(mobile, /mobile-home-featured-card__crown/);
    assert.match(css, /\.marketplace-card-crown/);
    assert.match(css, /position:\s*absolute/);
    assert.match(css, /marketplace-card-badges--below-crown/);
    // Regular cards must not reserve an empty white crown strip.
    assert.doesNotMatch(skeleton, /marketplace-card-crown/);
  });

  it("listing detail sticky panel and gallery surface FeaturedBadge", () => {
    const sticky = read("features/listings/components/ListingStickyPanel.tsx");
    const gallery = read("features/listings/components/ListingGallery.tsx");
    const details = read("features/listings/components/ListingDetailsView.tsx");
    assert.match(sticky, /FeaturedBadge/);
    assert.match(sticky, /isListingFeaturedActive/);
    assert.match(gallery, /featuredSize="md"/);
    assert.match(gallery, /onMedia/);
    assert.match(details, /FeaturedBadge/);
  });

  it("EN phrase covers مميّز label", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["مميّز"] ?? phrases["مميز"], "Featured");
  });

  it("shared Badge featured variant matches metallic gold ribbon", () => {
    const badge = read("shared/ui/Badge.tsx");
    assert.match(badge, /from-\[#f3e0a8\]/);
    assert.match(badge, /to-\[#8f6d2e\]/);
  });
});
