/**
 * Category/subcategory branch links must share one identifier
 * (`?subcategory=`), never a title search (`?q=`).
 * Run: node --test --experimental-strip-types scripts/subcategory-nav.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { normalizeSearchText } from "../shared/listings/search-text.ts";
import {
  branchNavigationRedirectHref,
  categoryPageHref,
} from "../features/search/components/search-url.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REAL_ESTATE_SUBS = ["شقق للبيع", "شقق للإيجار", "فلل", "مكاتب"];
const MOBILE_SUBS = ["آيفون", "سامسونج", "أجهزة لوحية", "إكسسوارات"];

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function specValuesEqual(stored, wanted) {
  const a = String(stored).trim().toLowerCase().replace(/\s+/g, " ");
  const b = String(wanted).trim().toLowerCase().replace(/\s+/g, " ");
  if (!a || !b) return false;
  return a === b || a.replace(/\s+/g, "") === b.replace(/\s+/g, "");
}

function subcategoryValuesEqual(stored, wanted) {
  if (specValuesEqual(stored, wanted)) return true;
  const a = normalizeSearchText(stored);
  const b = normalizeSearchText(wanted);
  return Boolean(a && b && a === b);
}

function matchKnownSubcategory(value, subcategories) {
  const needle = String(value ?? "").trim();
  if (!needle || subcategories.length === 0) return undefined;
  const exact = subcategories.find((item) => item === needle);
  if (exact) return exact;
  return subcategories.find((item) => subcategoryValuesEqual(item, needle));
}

function categoryBranchHref(slug, subcategory) {
  const trimmed = String(subcategory ?? "").trim();
  if (!trimmed) return `/categories/${slug}`;
  return `/categories/${slug}?subcategory=${encodeURIComponent(trimmed)}`;
}

function resolveCategoryBranchState(filters, subcategories) {
  const fromParam = matchKnownSubcategory(filters.subcategory, subcategories);
  const fromQuery = matchKnownSubcategory(filters.query, subcategories);
  const subcategory = fromParam ?? fromQuery ?? filters.subcategory ?? "";
  const query =
    fromQuery &&
    (!fromParam || subcategoryValuesEqual(fromParam, fromQuery))
      ? ""
      : filters.query;
  if (subcategory === (filters.subcategory ?? "") && query === filters.query) {
    return filters;
  }
  return { ...filters, subcategory, query };
}

function listingMatchesSubcategory(listing, wanted) {
  const stored =
    String(listing.subcategory ?? "").trim() ||
    String(listing.categorySpecs?.subcategory ?? "").trim();
  if (!stored) return false;
  return subcategoryValuesEqual(stored, wanted);
}

describe("subcategory branch navigation", () => {
  it("builds stable category/subcategory hrefs without q", () => {
    assert.equal(categoryBranchHref("real-estate"), "/categories/real-estate");
    assert.equal(
      categoryBranchHref("real-estate", "شقق للبيع"),
      `/categories/real-estate?subcategory=${encodeURIComponent("شقق للبيع")}`,
    );
    assert.doesNotMatch(categoryBranchHref("mobiles", "آيفون"), /[?&]q=/);
  });

  it("canonicalizes exact q bookmarks onto the taxonomy subcategory", () => {
    const resolved = resolveCategoryBranchState(
      { category: "real-estate", query: "شقق للبيع", subcategory: "" },
      REAL_ESTATE_SUBS,
    );
    assert.equal(resolved.subcategory, "شقق للبيع");
    assert.equal(resolved.query, "");

    const aliased = resolveCategoryBranchState(
      { category: "mobiles", query: "ايفون", subcategory: "" },
      MOBILE_SUBS,
    );
    assert.equal(aliased.subcategory, "آيفون");
    assert.equal(aliased.query, "");

    const leftover = resolveCategoryBranchState(
      { category: "real-estate", query: "كورنيش أبوظبي", subcategory: "" },
      REAL_ESTATE_SUBS,
    );
    assert.equal(leftover.subcategory, "");
    assert.equal(leftover.query, "كورنيش أبوظبي");
  });

  it("does not remap a keyword q without the parent category", () => {
    const filters = { query: "آيفون", subcategory: "" };
    const categoryId = filters.category?.trim();
    assert.equal(categoryId, undefined);
    assert.equal(filters.query, "آيفون");
  });

  it("redirects category ?q= branch bookmarks to ?subcategory=", () => {
    const incoming = {
      category: "real-estate",
      query: "شقق للبيع",
      subcategory: "",
    };
    const resolved = resolveCategoryBranchState(incoming, REAL_ESTATE_SUBS);
    const href = branchNavigationRedirectHref(incoming, resolved, {
      categorySlug: "real-estate",
    });
    assert.equal(href, categoryPageHref("real-estate", resolved));
    assert.match(href ?? "", /subcategory=/);
    assert.doesNotMatch(href ?? "", /[?&]q=/);
  });

  it("filters by listing.subcategory, not a word in the title", () => {
    const titled = {
      title: "طاولة لغرفة شقق للبيع في دبي",
      subcategory: "طاولات طعام",
    };
    const branched = {
      title: "استوديو في المارينا",
      subcategory: "شقق للبيع",
    };

    assert.equal(listingMatchesSubcategory(titled, "شقق للبيع"), false);
    assert.equal(listingMatchesSubcategory(branched, "شقق للبيع"), true);
    assert.match(titled.title, /شقق للبيع/);
  });

  it("directory, chips, and suggestions share categoryBranchHref", () => {
    const directory = read("features/categories/components/CategoryDirectory.tsx");
    assert.match(directory, /categoryBranchHref\(category\.slug, subcategory\)/);
    assert.doesNotMatch(directory, /categories\/\$\{category\.slug\}\?q=/);

    const page = read("app/categories/[slug]/page.tsx");
    assert.match(page, /categoryBranchHref\(category\.slug, subcategory\)/);
    assert.match(page, /resolveCategoryBranchState/);
    assert.doesNotMatch(page, /categories\/\$\{category\.slug\}\?q=/);

    const suggestions = read("features/search/components/search-suggestions.ts");
    assert.match(suggestions, /categoryBranchHref\(category\.slug, subcategory\)/);

    const suggest = read("services/search/suggest.service.ts");
    assert.match(suggest, /categoryBranchHref\(category\.slug, subcategory\)/);

    const match = read("shared/listings/listing-filter-match.ts");
    assert.match(match, /subcategoryValuesEqual\(stored, filters\.subcategory\)/);
    assert.match(match, /listingSpecValue\(listing, "subcategory"\)/);

    const sql = read("services/listings/listing-queries.ts");
    const subcategorySql = sql.slice(
      sql.indexOf("if (query.subcategory)"),
      sql.indexOf("if (query.area"),
    );
    assert.match(subcategorySql, /payload->>'subcategory'/);
    assert.match(subcategorySql, /payload->'categorySpecs'->>'subcategory'/);
    assert.doesNotMatch(subcategorySql, /payload->>'title'/);
  });

  it("keeps homepage keyword pills as title search, not subcategory ids", () => {
    const hero = read("services/content/homepage-marketplace.content.ts");
    assert.match(hero, /\/search\?q=مرسيدس/);
    assert.match(hero, /\/search\?q=آيفون/);
    assert.doesNotMatch(hero, /categoryBranchHref/);
  });

  it("package.json registers this navigation test", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.match(pkg.scripts.test, /subcategory-nav\.test\.mjs/);
  });
});

describe("known subcategory matching", () => {
  it("returns the canonical taxonomy label", () => {
    assert.equal(matchKnownSubcategory("شقق للبيع", REAL_ESTATE_SUBS), "شقق للبيع");
    assert.equal(matchKnownSubcategory("ايفون", MOBILE_SUBS), "آيفون");
    assert.equal(matchKnownSubcategory("مرسيدس", MOBILE_SUBS), undefined);
  });
});
