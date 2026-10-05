/**
 * Smart listing-form defaults: EV fuel/transmission, jobs, electronics, UI hint.
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
  SMART_FILL_HINT_AR,
} from "../shared/listings/listing-form-smart-defaults.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("inferListingFormSmartSpecs", () => {
  it("sets fuelType + automatic transmission for EV subcategory", () => {
    assert.deepEqual(
      inferListingFormSmartSpecs({
        categoryId: "cars",
        subcategory: "سيارات كهربائية",
      }),
      { fuelType: "كهربائي", transmission: "أوتوماتيك" },
    );
    assert.deepEqual(
      inferListingFormSmartSpecs({
        categoryId: "cars",
        subcategory: "كهربائية",
      }),
      { fuelType: "كهربائي", transmission: "أوتوماتيك" },
    );
  });

  it("sets fuelType/transmission for Tesla / BYD without overwriting seller choice", () => {
    const tesla = inferListingFormSmartSpecs({
      brand: "Tesla",
      categoryId: "cars",
    });
    assert.equal(tesla.fuelType, "كهربائي");
    assert.equal(tesla.transmission, "أوتوماتيك");
    assert.deepEqual(
      inferListingFormSmartSpecs({
        brand: "Tesla",
        categoryId: "cars",
        existing: { fuelType: "هجين", transmission: "يدوي" },
      }),
      {},
    );
  });

  it("seeds used condition, RE purpose/type, jobs listingType, electronics brand", () => {
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

    assert.equal(
      inferListingFormSmartSpecs({
        categoryId: "jobs",
        subcategory: "باحثون عن عمل",
      }).listingType,
      "seeker",
    );
    assert.equal(
      inferListingFormSmartSpecs({
        categoryId: "jobs",
        subcategory: "توظيف (وظائف)",
      }).listingType,
      "vacancy",
    );

    assert.equal(
      inferListingFormSmartSpecs({
        categoryId: "electronics",
        model: "PlayStation 5",
      }).brand,
      "Sony",
    );
    assert.equal(
      inferListingFormSmartSpecs({
        categoryId: "electronics",
        model: "MacBook Pro",
      }).brand,
      "Apple",
    );
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

  it("CategoryFieldsForm shows auto-fill hint and tracks smart keys", () => {
    const form = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(form, /inferListingFormSmartSpecs/);
    assert.match(form, /smartFilledKeys/);
    assert.match(form, /SMART_FILL_HINT_AR/);
    assert.match(form, /smartFilledKeys\.has\(field\.key\)/);
    assert.match(form, /الحقول الذكية/);
    assert.equal(
      SMART_FILL_HINT_AR,
      "تم اختياره تلقائياً — يمكنك تعديله",
    );
  });

  it("parser seeds smart specs before required checks", () => {
    const parse = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    assert.match(parse, /inferListingFormSmartSpecs/);
    assert.match(parse, /visibilitySpecs\[field\.key\]/);
  });
});
