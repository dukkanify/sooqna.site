/**
 * Admin listings location filter: emirate → areas cascade (no flat city mess).
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

describe("uae emirate helper contracts", () => {
  it("exports canonicalize + listing match helpers", () => {
    const src = read("shared/listings/uae-emirate.ts");
    assert.match(src, /export const UAE_EMIRATE_NAMES/);
    assert.match(src, /export function canonicalizeEmirate/);
    assert.match(src, /أبوظبي — مدينة خليفة/);
    assert.match(src, /export function listingMatchesEmirateFilter/);
    assert.match(src, /export function listingMatchesAreaFilter/);
    assert.match(src, /export function listingArea/);
    assert.match(src, /dubai:\s*"دبي"/);
    assert.match(src, /ajman:\s*"عجمان"/);
    assert.match(src, /"ام القيوين":\s*"أم القيوين"/);
  });
});

describe("admin listings emirate/area UI", () => {
  it("uses cascaded الإمارة + المنطقة selects (not flat كل المدن)", () => {
    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /label="الإمارة"/);
    assert.match(panel, /label="المنطقة"/);
    assert.match(panel, /UAE_EMIRATE_NAMES/);
    assert.match(panel, /areasForEmirate/);
    assert.match(panel, /listingMatchesEmirateFilter/);
    assert.match(panel, /listingMatchesAreaFilter/);
    assert.match(panel, /setAreaFilter\("all"\)/);
    assert.match(panel, /كل الإمارات/);
    assert.match(panel, /كل مناطق الإمارة/);
    // Flat dump of every city/area string must not power the filter.
    assert.doesNotMatch(panel, /كل المدن/);
    assert.doesNotMatch(
      panel,
      /listings\.map\(\(listing\) => listing\.city\)\.filter\(Boolean\)/,
    );
  });

  it("admin listing records expose emirate and area", () => {
    const types = read("types/domain/admin.ts");
    assert.match(types, /emirate\?: string;/);
    assert.match(types, /area\?: string;/);

    const queries = read("services/listings/listing-queries.ts");
    assert.match(queries, /payload->>'emirate' AS emirate/);
    assert.match(queries, /payload->>'area' AS area/);
  });
});
