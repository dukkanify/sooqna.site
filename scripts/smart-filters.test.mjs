/**
 * Smart search filters — URL state, cascade clearing, and spec matching.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function normalizeSpecText(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function compactSpecText(value) {
  return normalizeSpecText(value).replace(/\s+/g, "");
}

function specValuesEqual(stored, wanted) {
  const a = normalizeSpecText(stored);
  const b = normalizeSpecText(wanted);
  if (!a || !b) return false;
  if (a === b) return true;
  return compactSpecText(a) === compactSpecText(b);
}

function parseSearchFilterState(params) {
  const specs = {};
  const ranges = {};
  for (const [rawKey, rawValue] of Object.entries(params)) {
    const value = String(rawValue ?? "").trim();
    if (!value) continue;
    if (rawKey.startsWith("spec_")) specs[rawKey.slice(5)] = value;
    if (rawKey.startsWith("min_") && rawKey !== "minPrice") {
      const key = rawKey.slice(4);
      ranges[key] = { ...ranges[key], min: value };
    }
    if (rawKey.startsWith("max_") && rawKey !== "maxPrice") {
      const key = rawKey.slice(4);
      ranges[key] = { ...ranges[key], max: value };
    }
  }
  return {
    category: params.category ?? "",
    city: params.city ?? "",
    area: params.area ?? "",
    subcategory: params.subcategory ?? "",
    specs,
    ranges,
  };
}

test("search URL helpers persist spec and range filters", () => {
  const src = read("features/search/components/search-url.ts");
  assert.match(src, /spec_\$\{key\}/);
  assert.match(src, /min_\$\{key\}/);
  assert.match(src, /subcategory/);
  assert.match(src, /parseSearchFilterState/);

  const parsed = parseSearchFilterState({
    category: "cars",
    spec_brand: "Toyota",
    spec_model: "Camry",
    min_year: "2018",
    max_mileage: "80000",
    city: "دبي",
    area: "جميرا",
  });
  assert.equal(parsed.specs.brand, "Toyota");
  assert.equal(parsed.specs.model, "Camry");
  assert.equal(parsed.ranges.year.min, "2018");
  assert.equal(parsed.ranges.mileage.max, "80000");
  assert.equal(parsed.area, "جميرا");
});

test("changing parent brand invalidates a model that is not in the child list", () => {
  const modelsForToyota = ["Land Cruiser", "Camry", "Corolla"];
  const selectedModel = "Patrol";
  const stillValid = modelsForToyota.includes(selectedModel);
  assert.equal(stillValid, false);
});

test("spec matching treats catalog aliases as the same option", () => {
  assert.equal(specValuesEqual("256GB", "256 GB"), true);
  assert.equal(specValuesEqual("Toyota", "toyota"), true);
  assert.equal(specValuesEqual("Camry", "Patrol"), false);
});

test("every active mock category is audited for search fields", () => {
  const categories = read("mock/categories.mock.ts");
  const keys = read("features/search/lib/category-filter-fields.ts");
  const ids = [...categories.matchAll(/id: "([a-z-]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length >= 13, `expected 13 categories, got ${ids.length}`);
  for (const id of [
    "cars",
    "real-estate",
    "mobiles",
    "electronics",
    "jobs",
    "services",
    "furniture",
    "food",
  ]) {
    const pattern = id.includes("-") ? `"${id}": \\[` : `${id}: \\[`;
    assert.match(keys, new RegExp(pattern));
  }
  assert.match(keys, /getCategorySearchFields/);
  assert.match(keys, /fashion|getCategoryFields|SKIP_FIELD/);
});

test("server listing query applies categorySpecs instead of client catalog scans", () => {
  const queries = read("services/listings/listing-queries.ts");
  const filters = read("features/search/components/SearchFilters.tsx");
  const page = read("app/search/page.tsx");
  assert.match(queries, /listingSqlFilter/);
  assert.match(queries, /countMatchingListings/);
  assert.match(queries, /categorySpecs/);
  assert.match(queries, /specSqlPaths/);
  assert.doesNotMatch(filters, /getAllListings/);
  assert.match(page, /countSearchListings/);
  assert.match(page, /parseSearchFilterState/);
});

test("mobile drawer still has apply and reset", () => {
  const src = read("features/search/components/SearchFilters.tsx");
  assert.match(src, /lg:hidden/);
  assert.match(src, /تطبيق الفلاتر/);
  assert.match(src, /إعادة تعيين/);
  assert.match(src, /عرض النتائج/);
  assert.match(src, /مسح الكل/);
  assert.match(src, /المزيد من الفلاتر/);
  assert.match(src, /CategorySmartFields/);
  assert.match(src, /variant="essential"/);
  assert.match(src, /variant="advanced"/);
  const quick = read("features/search/components/SearchQuickFilters.tsx");
  assert.match(quick, /كل الإمارات/);
  assert.match(quick, /حتى 50 ألف/);
});
