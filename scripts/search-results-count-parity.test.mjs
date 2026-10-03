/**
 * Search/category toolbar totals must match the listings actually rendered.
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

describe("search results count parity", () => {
  it("resolveSearchResultTotal prefers fetched length when under the cap", () => {
    const service = read("services/listings/listings.service.ts");
    assert.match(service, /export const SEARCH_RESULT_LIMIT = 260/);
    assert.match(service, /export function resolveSearchResultTotal/);
    assert.match(
      service,
      /if \(fetchedCount < resultLimit\) return fetchedCount/,
    );
    assert.match(
      service,
      /return Math\.max\(countedTotal, fetchedCount\)/,
    );

    // Mirror the helper so the 8→4 mobiles case stays locked without TS path aliases.
    function resolveSearchResultTotal(
      fetchedCount,
      countedTotal,
      resultLimit = 260,
    ) {
      if (fetchedCount < resultLimit) return fetchedCount;
      return Math.max(countedTotal, fetchedCount);
    }
    assert.equal(resolveSearchResultTotal(4, 8), 4);
    assert.equal(resolveSearchResultTotal(0, 8), 0);
    assert.equal(resolveSearchResultTotal(260, 400), 400);
    assert.equal(resolveSearchResultTotal(260, 200), 260);
  });

  it("countMatchingListings applies the same visibility filter as queryListings", () => {
    const queries = read("services/listings/listing-queries.ts");
    const start = queries.indexOf("export async function countMatchingListings");
    assert.ok(start >= 0, "countMatchingListings exists");
    const countFn = queries.slice(start, start + 2200);
    assert.match(countFn, /finalizePublicCatalogRows/);
    assert.match(countFn, /SELECT payload FROM \$\{TABLE\}/);
    assert.doesNotMatch(countFn, /SELECT COUNT\(\*\)::int AS c FROM \$\{TABLE\}/);
  });

  it("live/showcase SQL also match payload.id (not only table id)", () => {
    const live = read("shared/listings/live-catalog-listing.ts");
    assert.match(live, /payload->>'id'/);
    assert.match(live, /live-mkt-%/);

    const showcase = read("shared/listings/showcase-listing.ts");
    assert.match(showcase, /payload->>'id'/);
    assert.match(showcase, /showcase-%/);
    const fixture = read("services/listings/mock-catalog-policy.ts");
    assert.match(fixture, /payload->>'id'/);
    assert.match(fixture, /user-listing-/);
  });

  it("category and search pages resolve totals before passing serverTotal", () => {
    const category = read("app/categories/[slug]/page.tsx");
    assert.match(category, /resolveSearchResultTotal/);
    assert.match(category, /serverTotal=\{resultTotal\}/);
    assert.match(category, /activeCount=\{resultTotal\}/);

    const search = read("app/search/page.tsx");
    assert.match(search, /resolveSearchResultTotal/);
    assert.match(search, /serverTotal=\{resultTotal\}/);

    const hero = read("features/categories/components/CategoryHero.tsx");
    assert.match(hero, /activeCount\?: number/);
    assert.match(
      hero,
      /typeof activeCount === "number" \? activeCount : category\.listingCount/,
    );
  });

  it("SearchResultsList ignores inflated serverTotal on short pages", () => {
    const list = read("features/search/components/SearchResultsList.tsx");
    assert.match(list, /SERVER_RESULT_CAP = 260/);
    assert.match(list, /listings\.length >= SERVER_RESULT_CAP/);
    assert.match(list, /visibleListings\.length/);
    assert.doesNotMatch(list, /from "@\/services\/listings"/);
  });

  it("package.json registers the parity test", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.match(pkg.scripts.test, /search-results-count-parity\.test\.mjs/);
  });
});
