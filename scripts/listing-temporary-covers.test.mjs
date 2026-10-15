/**
 * Empty listings get a temporary category-matched cover (display + persist).
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

describe("temporary listing covers for empty media", () => {
  it("wires helper + repair + cards + gallery + home cache", () => {
    const helper = read("shared/listings/temporary-listing-cover.ts");
    const repair = read("services/listings/listing-inline-media-repair.ts");
    const utils = read("features/listings/components/listing-card.utils.ts");
    const card = read("features/listings/components/PremiumListingCard.tsx");
    const mobile = read("features/home/components/mobile/MobileFeaturedCard.tsx");
    const gallery = read("features/listings/components/ListingGallery.tsx");
    const feed = read("services/listings/home-feed.ts");

    assert.match(helper, /galleryForListingProduct/);
    assert.match(helper, /listingCoverUrlOrTemporary/);
    assert.match(helper, /temporaryCoverUrlForListing/);
    assert.match(repair, /temporaryCoverUrlsForListing/);
    assert.match(repair, /withTemporaryCover/);
    assert.match(utils, /getListingCardImageUrl/);
    assert.match(card, /getListingCardImageUrl/);
    assert.match(mobile, /getListingCardImageUrl/);
    assert.match(gallery, /temporaryCoverUrlsForListing/);
    assert.match(feed, /sooqna-home-feed-v37-temp-covers/);
  });
});
