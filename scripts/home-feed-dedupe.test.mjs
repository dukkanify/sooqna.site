/**
 * Homepage feed ordering + cross-section dedupe contract.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sortByMostViewed } from "../services/listings/home-feed-rank.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("home feed most-viewed sort", () => {
  it("orders by views then newer postedAt", () => {
    const rows = sortByMostViewed([
      { id: "a", views: 2, postedAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", views: 5, postedAt: "2026-01-01T00:00:00.000Z" },
      { id: "c", views: 5, postedAt: "2026-02-01T00:00:00.000Z" },
    ]);
    assert.deepEqual(
      rows.map((row) => row.id),
      ["c", "b", "a"],
    );
  });
});

describe("home feed composition contract", () => {
  it("builds featured before most-viewed sections before nearby", () => {
    const src = read("services/listings/home-feed.ts");
    const featuredIdx = src.indexOf("// 1) Featured first");
    const sectionsIdx = src.indexOf("// 2) Most-visited per category");
    const nearbyIdx = src.indexOf("// 3) Nearby last");
    assert.ok(featuredIdx > 0 && sectionsIdx > featuredIdx && nearbyIdx > sectionsIdx);
    assert.match(src, /pickDiverseFeaturedListings/);
  });

  it("pins active featured listings first in catalog query order", () => {
    const src = read("services/listings/listing-queries.ts");
    assert.match(src, /compareListingsWithFeaturedPriority/);
    assert.match(src, /featuredFirst/);
    assert.match(src, /featuredRecency/);
  });

  it("keeps search and category grids on the featured-first comparator", () => {
    const src = read("features/search/components/SearchResultsList.tsx");
    assert.match(src, /compareListingsWithFeaturedPriority/);
    assert.doesNotMatch(src, /a\.price - b\.price/);
  });

  it("does not render the redundant market preview strip on home", () => {
    const page = read("app/page.tsx");
    const mobile = read("features/home/components/mobile/MobileHomePage.tsx");
    assert.doesNotMatch(page, /MarketPreviewStrip/);
    assert.doesNotMatch(mobile, /MobilePreviewStrip/);
    assert.doesNotMatch(page, /feed\.preview/);
  });

  it("empty home uses catalogCount, not diverse leftover slices", () => {
    const desktop = read(
      "features/home/components/marketplace/DesktopHomeFeed.tsx",
    );
    const mobile = read(
      "features/home/components/mobile/MobileHomeFeed.tsx",
    );
    const feed = read("services/listings/home-feed.ts");
    assert.match(feed, /catalogCount: catalogRows\.length/);
    assert.match(desktop, /feed\.catalogCount > 0/);
    assert.match(mobile, /feed\.catalogCount === 0/);
    assert.match(feed, /allowReuse/);
  });
});
