/**
 * Featured page product rules — appearance, order, duration labels.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareFeaturedListings,
  compareListingsWithFeaturedPriority,
  featuredPageRuleLabels,
  isEligibleFeaturedPageListing,
  pickDiverseFeaturedListings,
  sortFeaturedPageListings,
} from "../shared/listings/featured-page-rules.ts";

function listing(partial) {
  return {
    id: "a",
    slug: "a",
    title: "t",
    categoryId: "cars",
    price: 1,
    currency: "AED",
    status: "active",
    city: "دبي",
    seller: { id: "s", name: "S" },
    images: [],
    isFeatured: true,
    featuredUntil: "2099-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("featured page rules", () => {
  it("requires paid featured + public status + active window", () => {
    assert.equal(isEligibleFeaturedPageListing(listing({})), true);
    assert.equal(
      isEligibleFeaturedPageListing(listing({ isFeatured: false })),
      false,
    );
    assert.equal(
      isEligibleFeaturedPageListing(listing({ status: "pending_review" })),
      false,
    );
    assert.equal(
      isEligibleFeaturedPageListing(
        listing({ featuredUntil: "2000-01-01T00:00:00.000Z" }),
      ),
      false,
    );
    assert.equal(
      isEligibleFeaturedPageListing(listing({ status: "reserved" })),
      true,
    );
  });

  it("orders most recently featured first", () => {
    const older = listing({
      id: "old",
      featuredUntil: "2099-01-10T00:00:00.000Z",
    });
    const newer = listing({
      id: "new",
      featuredUntil: "2099-01-20T00:00:00.000Z",
    });
    assert.ok(compareFeaturedListings(newer, older) < 0);
    assert.deepEqual(
      sortFeaturedPageListings([older, newer]).map((row) => row.id),
      ["new", "old"],
    );
  });

  it("exposes duration in rule labels", () => {
    const labels = featuredPageRuleLabels(14);
    assert.ok(labels.some((label) => label.includes("14")));
    assert.ok(labels.some((label) => label.includes("الترتيب")));
    assert.ok(labels.some((label) => label.includes("الظهور")));
    assert.ok(labels.some((label) => label.includes("الصفحة الرئيسية")));
    assert.ok(labels.some((label) => label.includes("التصنيف")));
  });

  it("pins paid featured above regular ads even on price sort", () => {
    const cheap = listing({
      id: "cheap",
      isFeatured: false,
      featuredUntil: undefined,
      price: 10,
      postedAt: "2026-09-20T00:00:00.000Z",
    });
    const featuredExpensive = listing({
      id: "feat",
      price: 999,
      postedAt: "2026-01-01T00:00:00.000Z",
    });
    const expired = listing({
      id: "expired",
      price: 5,
      featuredUntil: "2000-01-01T00:00:00.000Z",
      postedAt: "2026-09-28T00:00:00.000Z",
    });
    const ranked = [cheap, featuredExpensive, expired].sort((a, b) =>
      compareListingsWithFeaturedPriority(a, b, "price_asc"),
    );
    assert.equal(ranked[0].id, "feat");
    assert.deepEqual(
      ranked.slice(1).map((row) => row.id),
      ["expired", "cheap"],
    );
  });

  it("spreads homepage featured by category then location", () => {
    const now = Date.parse("2026-09-29T00:00:00.000Z");
    const carsDubaiNew = listing({
      id: "cars-dxb-new",
      categoryId: "cars",
      emirate: "دبي",
      city: "دبي",
      featuredUntil: "2099-03-01T00:00:00.000Z",
    });
    const carsDubaiOld = listing({
      id: "cars-dxb-old",
      categoryId: "cars",
      emirate: "دبي",
      city: "دبي",
      featuredUntil: "2099-02-01T00:00:00.000Z",
    });
    const electronicsDxb = listing({
      id: "elec-dxb",
      categoryId: "electronics",
      emirate: "دبي",
      city: "دبي",
      featuredUntil: "2099-02-15T00:00:00.000Z",
    });
    const reSharjah = listing({
      id: "re-shj",
      categoryId: "real-estate",
      emirate: "الشارقة",
      city: "الشارقة",
      featuredUntil: "2099-02-10T00:00:00.000Z",
    });
    const picked = pickDiverseFeaturedListings(
      [carsDubaiOld, electronicsDxb, carsDubaiNew, reSharjah],
      3,
      now,
    );
    assert.deepEqual(
      picked.map((row) => row.id),
      ["cars-dxb-new", "re-shj", "elec-dxb"],
    );
  });
});
