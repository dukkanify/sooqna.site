/**
 * Featured badge redesign — clearer gold marker with star.
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
  it("FeaturedBadge uses gold marker + star, not tiny rounded-full pill", () => {
    const badge = read("features/listings/components/FeaturedBadge.tsx");
    const css = read("features/listings/components/featured-badge.css");
    const cards = read("features/listings/components/ListingCardBadges.tsx");
    assert.match(badge, /listing-featured-badge/);
    assert.match(badge, /name="star"/);
    assert.match(badge, /مميّز/);
    assert.match(css, /linear-gradient/);
    assert.match(css, /#c9a45c/);
    assert.doesNotMatch(cards, /!rounded-full/);
    assert.match(cards, /FeaturedBadge/);
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
});
