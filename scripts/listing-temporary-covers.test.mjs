/**
 * Empty listings may show a temporary category-matched cover in the UI only.
 * Real seller Blob photos must optimize (or load unoptimized) — never fall
 * through to the abstract default Unsplash gradient.
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

describe("listing media honesty + blob optimize", () => {
  it("allows Vercel Blob in next/image remotePatterns", () => {
    const src = read("next.config.ts");
    assert.match(src, /public\.blob\.vercel-storage\.com/);
    assert.match(src, /blob\.vercel-storage\.com/);
  });

  it("loads Blob via unoptimized next/image and never uses default stock on galleries", () => {
    const appImage = read("shared/components/AppImage.tsx");
    const gallery = read("features/listings/components/ListingGallery.tsx");
    const card = read("features/listings/components/PremiumListingCard.tsx");
    const mobile = read("features/home/components/mobile/MobileFeaturedCard.tsx");
    assert.match(appImage, /unoptimized=\{useUnoptimized\}/);
    assert.match(appImage, /public\\.blob\\.vercel-storage\\.com/);
    assert.match(gallery, /fallback="none"/);
    assert.match(card, /fallback="none"/);
    assert.match(mobile, /fallback="none"/);
    assert.doesNotMatch(gallery, /fallbackCategory="default"/);
  });

  it("keeps temporary covers display-only (no Unsplash persist in repair)", () => {
    const helper = read("shared/listings/temporary-listing-cover.ts");
    const repair = read("services/listings/listing-inline-media-repair.ts");
    const utils = read("features/listings/components/listing-card.utils.ts");
    const feed = read("services/listings/home-feed.ts");

    assert.match(helper, /galleryForListingProduct/);
    assert.match(helper, /listingCoverUrlOrTemporary/);
    assert.match(utils, /getListingCardImageUrl/);
    assert.doesNotMatch(repair, /temporaryCoverUrlsForListing/);
    assert.doesNotMatch(repair, /withTemporaryCover/);
    assert.match(repair, /Does NOT invent Unsplash/);
    assert.match(feed, /sooqna-home-feed-v38-blob-optimize/);
  });
});
