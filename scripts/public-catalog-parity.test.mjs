/**
 * Home / search / category share one public catalog:
 * unique listing ids, same visibility filters, count === cards.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  dedupeListingsById,
  resolveUniqueResultTotal,
} from "../services/listings/public-catalog.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("public catalog parity", () => {
  it("dedupes duplicate payload rows so 4 SQL hits become 2 cards", () => {
    const rows = [
      { id: "a", slug: "a" },
      { id: "b", slug: "b" },
      { id: "a", slug: "a-dup" },
      { id: "b", slug: "b-dup" },
    ];
    assert.deepEqual(
      dedupeListingsById(rows).map((row) => row.id),
      ["a", "b"],
    );
    assert.equal(resolveUniqueResultTotal(2, 4, 260), 2);
    assert.equal(resolveUniqueResultTotal(0, 8, 260), 0);
  });

  it("queryListings and countMatchingListings share finalizePublicCatalogRows", () => {
    const queries = read("services/listings/listing-queries.ts");
    assert.match(queries, /function finalizePublicCatalogRows/);
    const queryFn = queries.slice(queries.indexOf("export async function queryListings"));
    assert.match(queryFn.slice(0, 2500), /finalizePublicCatalogRows/);
    const countFn = queries.slice(
      queries.indexOf("export async function countMatchingListings"),
    );
    assert.match(countFn.slice(0, 1800), /finalizePublicCatalogRows/);
    assert.match(queries, /overFetch/);
    assert.match(
      queries,
      /COALESCE\(NULLIF\(payload->>'status', ''\), status\) IN \('active', 'reserved'\)/,
    );
  });

  it("search/category grids unique by id and home empty uses catalogCount", () => {
    const list = read("features/search/components/SearchResultsList.tsx");
    assert.match(list, /seen\.has\(key\)/);
    assert.match(list, /visibleListings\.length/);

    const service = read("services/listings/listings.service.ts");
    assert.match(service, /dedupeListingsById\(results\)/);

    const desktop = read(
      "features/home/components/marketplace/DesktopHomeFeed.tsx",
    );
    assert.match(desktop, /feed\.catalogCount > 0/);
  });

  it("package.json registers this parity test", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.match(pkg.scripts.test, /public-catalog-parity\.test\.mjs/);
  });
});
