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
    assert.match(src, /محمد بن زايد – أبوظبي/);
    assert.match(src, /splitLocationParts/);
    assert.match(src, /export function listingMatchesEmirateFilter/);
    assert.match(src, /export function listingMatchesAreaFilter/);
    assert.match(src, /export function listingArea/);
    assert.match(src, /export function inferEmirateFromArea/);
    assert.match(src, /dubai:\s*"دبي"/);
    assert.match(src, /ajman:\s*"عجمان"/);
    assert.match(src, /"ام القيوين":\s*"أم القيوين"/);
  });
});

describe("compound city labels", () => {
  const EMIRATES = [
    "أبوظبي",
    "دبي",
    "الشارقة",
    "عجمان",
    "أم القيوين",
    "رأس الخيمة",
    "الفجيرة",
  ];

  function split(value) {
    return value
      .split(/\s*[—–\-|/,،]+\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function emirateFrom(value) {
    const direct = EMIRATES.find((name) => name === value.trim());
    if (direct) return direct;
    for (const part of split(value)) {
      const hit = EMIRATES.find((name) => name === part);
      if (hit) return hit;
    }
    return undefined;
  }

  function areaFrom(value) {
    const emirate = emirateFrom(value);
    const parts = split(value);
    if (parts.length >= 2 && emirate) {
      return parts.filter((part) => part !== emirate).join(" — ");
    }
    return undefined;
  }

  it("splits area-first and emirate-first city strings", () => {
    assert.deepEqual(split("محمد بن زايد – أبوظبي"), [
      "محمد بن زايد",
      "أبوظبي",
    ]);
    assert.deepEqual(split("أبوظبي — مدينة خليفة"), [
      "أبوظبي",
      "مدينة خليفة",
    ]);
    assert.deepEqual(split("مدينة محمد بن زايد - أبوظبي"), [
      "مدينة محمد بن زايد",
      "أبوظبي",
    ]);
  });

  it("resolves emirate + area for محمد بن زايد – أبوظبي", () => {
    assert.equal(emirateFrom("محمد بن زايد – أبوظبي"), "أبوظبي");
    assert.equal(areaFrom("محمد بن زايد – أبوظبي"), "محمد بن زايد");
    assert.equal(emirateFrom("أبوظبي — مدينة خليفة"), "أبوظبي");
    assert.equal(areaFrom("أبوظبي — مدينة خليفة"), "مدينة خليفة");
    assert.equal(emirateFrom("مدينة محمد بن زايد - أبوظبي"), "أبوظبي");
    assert.equal(areaFrom("مدينة محمد بن زايد - أبوظبي"), "مدينة محمد بن زايد");
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
    assert.match(panel, /function setAreaFilter/);
    assert.match(panel, /writeDeskQuery\(\{ emirate: next, area: "all" \}\)/);
    assert.match(panel, /كل الإمارات/);
    assert.match(panel, /كل مناطق الإمارة/);
    // Flat dump of every city/area string must not power the filter.
    assert.doesNotMatch(panel, /كل المدن/);
    assert.doesNotMatch(
      panel,
      /listings\.map\(\(listing\) => listing\.city\)\.filter\(Boolean\)/,
    );
  });

  it("create/edit forms cascade emirate → area (not flat city dropdown)", () => {
    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /emirateFormOptions/);
    assert.match(panel, /function areaFormOptions/);
    assert.match(panel, /emirate: "دبي"/);
    assert.match(panel, /area: ""/);
    assert.match(panel, /name="emirate"/);
    assert.match(panel, /name="area"/);
    assert.match(panel, /listingEmirate\(listing\)/);
    assert.match(panel, /listingArea\(listing\)/);
    // Persist both fields on create + edit.
    assert.match(panel, /emirate,\s*\n\s*area,/);
    assert.match(panel, /form\.area\.trim\(\)/);
    assert.match(panel, /editDraft\.emirate/);
    assert.match(panel, /editDraft\.area/);
    // No marketplace locations flat list on forms.
    assert.doesNotMatch(panel, /useMarketplaceLocations/);
    assert.doesNotMatch(panel, /label="المدينة"/);
    assert.doesNotMatch(panel, /cities\.map/);
  });

  it("admin listing records expose emirate and area", () => {
    const types = read("types/domain/admin.ts");
    assert.match(types, /emirate\?: string;/);
    assert.match(types, /area\?: string;/);
    assert.match(types, /\|\s*"area"/);

    const queries = read("services/listings/listing-queries.ts");
    assert.match(queries, /payload->>'emirate' AS emirate/);
    assert.match(queries, /payload->>'area' AS area/);

    const store = read("services/listings/listing-store.ts");
    assert.match(store, /patch\.area !== undefined/);
    assert.match(store, /area: input\.area\?\.trim/);
  });
});
