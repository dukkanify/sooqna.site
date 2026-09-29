/**
 * Price from–to filter validation + AED currency contract.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MARKETPLACE_CURRENCY,
  isPriceRangeInverted,
  normalizePriceRange,
  parsePriceInput,
} from "../features/search/lib/price-range.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("price range parse + validate", () => {
  it("parses non-negative prices and rejects junk", () => {
    assert.equal(parsePriceInput("1200"), 1200);
    assert.equal(parsePriceInput("1,200"), 1200);
    assert.equal(parsePriceInput(""), undefined);
    assert.equal(parsePriceInput("-5"), undefined);
    assert.equal(parsePriceInput("abc"), undefined);
  });

  it("flags inverted min > max", () => {
    assert.equal(isPriceRangeInverted("500", "100"), true);
    assert.equal(isPriceRangeInverted("100", "500"), false);
    assert.equal(isPriceRangeInverted("100", ""), false);
    assert.equal(isPriceRangeInverted("", "100"), false);
  });

  it("normalizes inverted ranges by swapping for safe queries", () => {
    assert.deepEqual(normalizePriceRange("800", "200"), { min: 200, max: 800 });
    assert.deepEqual(normalizePriceRange("200", "800"), { min: 200, max: 800 });
    assert.deepEqual(normalizePriceRange("50", ""), { min: 50, max: undefined });
  });

  it("uses AED as marketplace currency", () => {
    assert.equal(MARKETPLACE_CURRENCY, "AED");
  });
});

describe("price range UI wiring", () => {
  it("SearchFilters uses PriceRangeFields and blocks inverted submit", () => {
    const src = read("features/search/components/SearchFilters.tsx");
    assert.match(src, /PriceRangeFields/);
    assert.match(src, /guardRangeSubmit/);
    assert.match(src, /isPriceRangeInverted/);
    assert.doesNotMatch(src, /name="minPrice"[\s\S]*defaultValue=\{draft\.minPrice\}/);
  });

  it("PriceRangeFields shows AED and from–to labels", () => {
    const src = read("features/search/components/PriceRangeFields.tsx");
    assert.match(src, /MARKETPLACE_CURRENCY/);
    assert.match(src, /name="minPrice"/);
    assert.match(src, /name="maxPrice"/);
    assert.match(src, /PRICE_RANGE_ERROR_AR/);
  });
});
