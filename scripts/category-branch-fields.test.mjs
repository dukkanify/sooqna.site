/**
 * Every category/subcategory branch needs appropriate Fields + Validation.
 * Run: node --test --experimental-strip-types scripts/category-branch-fields.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  fieldRequiredForSpecs,
  fieldVisibleForSpecs,
  withVisibilityContext,
} from "../shared/listings/category-field-visibility.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("category branch fields", () => {
  it("covers fashion/kids/sports/books as dynamic categories", () => {
    const src = read("shared/constants/category-fields.ts");
    for (const id of ["fashion", "kids", "sports", "books"]) {
      assert.match(src, new RegExp(`"${id}"`));
    }
    assert.match(src, /fashion:\s*goodsFields/);
    assert.match(src, /kids:\s*goodsFields/);
    assert.match(src, /const goodsFields/);
  });

  it("electronics cameras require shutter/lens; laptops require storage/ram", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key:\s*"shutterCount"/);
    assert.match(src, /key:\s*"lensIncluded"/);
    assert.match(src, /showWhen:\s*\{\s*key:\s*"subcategory",\s*values:\s*\["كاميرات"\]/);
    assert.match(src, /showWhen:\s*\{\s*key:\s*"subcategory",\s*values:\s*\["لابتوبات"\]/);

    const shutter = {
      key: "shutterCount",
      required: true,
      showWhen: { key: "subcategory", values: ["كاميرات"] },
    };
    const storage = {
      key: "storage",
      required: true,
      showWhen: { key: "subcategory", values: ["لابتوبات"] },
    };
    const cameras = withVisibilityContext({}, { subcategory: "كاميرات" });
    const laptops = withVisibilityContext({}, { subcategory: "لابتوبات" });
    assert.equal(fieldVisibleForSpecs(shutter, cameras), true);
    assert.equal(fieldRequiredForSpecs(shutter, cameras), true);
    assert.equal(fieldVisibleForSpecs(storage, cameras), false);
    assert.equal(fieldVisibleForSpecs(storage, laptops), true);
    assert.equal(fieldVisibleForSpecs(shutter, laptops), false);
  });

  it("electronics and mobiles include emirate/city location fields", () => {
    const src = read("shared/constants/category-fields.ts");
    // electronicsFields block now contains emirate after modelOther
    assert.match(src, /const electronicsFields[\s\S]*key:\s*"emirate"[\s\S]*const goodsFields/);
    assert.match(src, /accessoriesIncluded[\s\S]*key:\s*"emirate"[\s\S]*key:\s*"condition"/);
  });

  it("pets condition is only required for مستلزمات", () => {
    const condition = {
      key: "condition",
      required: true,
      showWhen: { key: "animalType", values: ["مستلزمات"] },
    };
    const live = withVisibilityContext({ animalType: "قطط" }, {});
    const supplies = withVisibilityContext({ animalType: "مستلزمات" }, {});
    assert.equal(fieldVisibleForSpecs(condition, live), false);
    assert.equal(fieldVisibleForSpecs(condition, supplies), true);
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /حالة المستلزم/);
    assert.match(src, /showWhen:\s*\{\s*key:\s*"animalType",\s*values:\s*\["مستلزمات"\]/);
  });

  it("parser seeds furnitureType and goods itemType from subcategory", () => {
    const src = read("features/listings/components/add-listing/category-form-utils.ts");
    assert.match(src, /inferListingFormSmartSpecs/);
    const step = read("features/listings/components/add-listing/CategoryFieldsStep.tsx");
    assert.match(step, /inferListingFormSmartSpecs/);
    const smart = read("shared/listings/listing-form-smart-defaults.ts");
    assert.match(smart, /furnitureType/);
    assert.match(smart, /itemType/);
  });

  it("directory and electronics cameras share one subcategory branch href", () => {
    const branch = read("shared/listings/category-branch.ts");
    assert.match(branch, /export function categoryBranchHref/);
    assert.match(branch, /subcategory=/);
    const directory = read("features/categories/components/CategoryDirectory.tsx");
    assert.match(directory, /categoryBranchHref/);
    const chips = read("app/categories/[slug]/page.tsx");
    assert.match(chips, /categoryBranchHref/);
    const expected =
      "/categories/electronics?subcategory=" + encodeURIComponent("كاميرات");
    assert.equal(
      expected,
      "/categories/electronics?subcategory=%D9%83%D8%A7%D9%85%D9%8A%D8%B1%D8%A7%D8%AA",
    );
  });
});
