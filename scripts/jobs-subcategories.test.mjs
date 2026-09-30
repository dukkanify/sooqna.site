/**
 * Jobs subcategory taxonomy: توظيف vs باحثون عن عمل.
 * Run: node --test scripts/jobs-subcategories.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("jobs subcategories", () => {
  it("seeds only توظيف and باحثون عن عمل under jobs", () => {
    const mock = read("mock/categories.mock.ts");
    const jobsBlock = mock.match(/id:\s*"jobs"[\s\S]*?subcategories:\s*(\[[^\]]+\])/);
    assert.ok(jobsBlock, "jobs category missing");
    assert.match(jobsBlock[1], /توظيف \(وظائف\)/);
    assert.match(jobsBlock[1], /باحثون عن عمل/);
    assert.doesNotMatch(jobsBlock[1], /مبيعات/);
  });

  it("exposes taxonomy helpers and migration", () => {
    const taxonomy = read("shared/listings/jobs-taxonomy.ts");
    assert.match(taxonomy, /JOB_SUBCATEGORY_VACANCY/);
    assert.match(taxonomy, /JOB_SUBCATEGORY_SEEKER/);
    assert.match(taxonomy, /migrateJobsListingFields/);
    assert.match(taxonomy, /ensureJobsCategorySubcategories/);
    assert.match(taxonomy, /specialty/);
  });

  it("aligns form listingType labels with subcategories", () => {
    const fields = read("shared/constants/category-fields.ts");
    assert.match(fields, /label:\s*"توظيف \(وظائف\)"/);
    assert.match(fields, /label:\s*"باحثون عن عمل"/);
    assert.match(fields, /value:\s*"vacancy"/);
    assert.match(fields, /value:\s*"seeker"/);
  });

  it("wires category store + listing store migration", () => {
    const categories = read("services/categories/category-store.ts");
    assert.match(categories, /ensureJobsCategorySubcategories/);

    const listings = read("services/listings/listing-store.ts");
    assert.match(listings, /migrateJobsListingFields/);

    const form = read("features/listings/components/add-listing/category-form-utils.ts");
    assert.match(form, /jobSubcategory/);
    assert.match(form, /listingTypeFromSubcategory/);
  });

  it("labels jobs subcategory filter as نوع الإعلان", () => {
    const filters = read("features/search/lib/category-filter-fields.ts");
    assert.match(filters, /categoryId === "jobs".*نوع الإعلان/s);
    assert.doesNotMatch(
      filters,
      /jobs:\s*\[[^\]]*listingType/,
    );
  });
});
