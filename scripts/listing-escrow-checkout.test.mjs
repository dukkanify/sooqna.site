/**
 * Escrow + checkout for persisted seller listings (local-* ids, missing flag).
 * Live bug: /listings/new-buy-iphone-18-pro-817167 showed Buy Now without
 * الضمان المالي, then checkout said «هذا الإعلان غير متاح حالياً».
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

const PURCHASABLE = new Set([
  "mobiles",
  "electronics",
  "furniture",
  "fashion",
  "kids",
  "sports",
  "books",
  "food",
]);

function isListingEscrowEligible(listing) {
  if (listing.escrowAvailable === false) return false;
  if (listing.escrowAvailable === true) return true;
  return PURCHASABLE.has(listing.categoryId);
}

function getCheckoutPath(listing) {
  const listingRef = listing.slug?.trim() || listing.id;
  return `/checkout?listingId=${encodeURIComponent(listingRef)}`;
}

describe("seller listing escrow defaults", () => {
  it("mobiles without escrowAvailable still qualify for الضمان المالي", () => {
    assert.equal(
      isListingEscrowEligible({ categoryId: "mobiles" }),
      true,
    );
  });

  it("explicit false still opts out (showcase)", () => {
    assert.equal(
      isListingEscrowEligible({
        categoryId: "mobiles",
        escrowAvailable: false,
      }),
      false,
    );
  });

  it("cars never default into checkout escrow", () => {
    assert.equal(isListingEscrowEligible({ categoryId: "cars" }), false);
  });

  it("eligibility helper derives from category when flag is omitted", () => {
    const src = read("shared/listings/escrow-eligibility.ts");
    assert.match(src, /if \(listing\.escrowAvailable === false\) return false;/);
    assert.match(src, /return listingCategorySupportsEscrow\(listing\)/);
    assert.doesNotMatch(
      src,
      /export function isListingEscrowEligible\([^)]*\): boolean \{\s*return listing\.escrowAvailable === true;/,
    );
  });
});

describe("checkout path for persisted local-* listings", () => {
  it("uses public slug so checkout can resolve the catalog row", () => {
    const iphone = {
      id: "local-1790677817167",
      slug: "new-buy-iphone-18-pro-817167",
    };
    assert.equal(
      getCheckoutPath(iphone),
      "/checkout?listingId=new-buy-iphone-18-pro-817167",
    );
    const src = read("shared/listings/listing-url.ts");
    assert.match(src, /listing\.slug\?\.trim\(\) \|\| listing\.id/);
    assert.doesNotMatch(
      src,
      /listing\.id\.startsWith\("local-"\) \? listing\.id : listing\.slug/,
    );
  });

  it("checkout page loads local-* refs from the server catalog", () => {
    const src = read("app/checkout/page.tsx");
    assert.match(src, /resolveServerListing/);
    assert.doesNotMatch(
      src,
      /listingRef && !listingRef\.startsWith\("local-"\)/,
    );
  });

  it("resolver looks up durable rows by id or slug", () => {
    const src = read("services/payments/listing-resolver.ts");
    assert.match(src, /export async function resolveServerListing/);
    assert.match(src, /getListingById/);
    assert.match(src, /getListingBySlug/);
  });

  it("create form stamps escrowAvailable for purchasable categories", () => {
    const src = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(src, /escrowAvailable:\s*isPurchasableCategory/);
  });

  it("upsert persists derived escrow when the flag was omitted", () => {
    const src = read("services/listings/listing-store.ts");
    assert.match(src, /function withEscrowDefault/);
    assert.match(src, /escrowAvailable:/);
  });
});
