/**
 * Featured page product rules — appearance, order, duration labels.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareFeaturedListings,
  featuredPageRuleLabels,
  isEligibleFeaturedPageListing,
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
  });
});
