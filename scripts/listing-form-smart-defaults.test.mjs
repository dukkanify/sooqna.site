/**
 * Smart listing-form defaults: EV fuel, RE purpose, branch types.
 * Run: node --test --experimental-strip-types scripts/listing-form-smart-defaults.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyListingFormSmartSpecs,
  inferListingFormSmartSpecs,
} from "../shared/listings/listing-form-smart-defaults.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("inferListingFormSmartSpecs", () => {
  it("sets fuelType to كهربائي for EV subcategory", () => {
    assert.deepEqual(
      inferListingFormSmartSpecs({
        categoryId: "cars",
        subcategory: "سيارات كهربائية",
      }),
      { fuelType: "كهربائي" },
    );
    assert.deepEqual(
      inferListingFormSmartSpecs({
        categoryId: "cars",
        subcategory: "كهربائية",
      }),
      { fuelType: "كهربائي" },
    );
  });

  it("sets fuelType for Tesla / BYD brands without overwriting seller choice", () => {
    assert.equal(
      inferListingFormSmartSpecs({
        brand: "Tesla",
        categoryId: "cars",
      }).fuelType,
      "كهربائي",
    );
    assert.equal(
      inferListingFormSmartSpecs({
        brand: "BYD",
        categoryId: "cars",
      }).fuelType,
      "كهربائي",
    );
    assert.deepEqual(
      inferListingFormSmartSpecs({
        brand: "Tesla",
        categoryId: "cars",
        existing: { fuelType: "هجين" },
      }),
      {},
    );
  });

  it("seeds used condition for مستعملة and RE purpose/type from subcategory", () => {
    assert.equal(
      inferListingFormSmartSpecs({
        categoryId: "cars",
        subcategory: "سيارات مستعملة",
      }).condition,
      "used",
    );
    const rent = inferListingFormSmartSpecs({
      categoryId: "real-estate",
      subcategory: "شقق للإيجار",
    });
    assert.equal(rent.purpose, "للإيجار");
    assert.equal(rent.propertyType, "شقة");
  });

  it("seeds mobile brand and pets/furniture branch types", () => {
    assert.equal(
      inferListingFormSmartSpecs({
        categoryId: "mobiles",
        subcategory: "آيفون",
      }).brand,
      "Apple",
    );
    assert.equal(
      inferListingFormSmartSpecs({
        categoryId: "pets",
        subcategory: "قطط",
      }).animalType,
      "قطط",
    );
    assert.equal(
      applyListingFormSmartSpecs({
        categoryId: "furniture",
        existing: { furnitureType: "كنب" },
        subcategory: "غرف نوم",
      }).furnitureType,
      "كنب",
    );
  });
});

describe("add-listing wiring", () => {
  it("CategoryFieldsStep uses smart defaults helper", () => {
    const step = read(
      "features/listings/components/add-listing/CategoryFieldsStep.tsx",
    );
    assert.match(step, /inferListingFormSmartSpecs/);
    assert.match(step, /categorySpecs: smartSpecs/);
  });

  it("CategoryFieldsForm applies smart fills on brand/model change", () => {
    const form = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(form, /inferListingFormSmartSpecs/);
    assert.match(form, /key === "brand" \|\| key === "model"/);
    assert.match(form, /حقول الذكية|الحقول الذكية/);
  });

  it("parser seeds smart specs before required checks", () => {
    const parse = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    assert.match(parse, /inferListingFormSmartSpecs/);
    assert.match(parse, /visibilitySpecs\[field\.key\]/);
  });
});
