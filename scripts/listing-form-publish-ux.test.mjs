/**
 * Add-listing publish UX — shorter car form, scroll to field, clear sticky errors.
 * Run: node --test --experimental-strip-types scripts/listing-form-publish-ux.test.mjs
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

describe("listing form publish UX", () => {
  it("cars keep only core specs required for publish", () => {
    const src = read("shared/constants/category-fields.ts");
    const carBlock = src.slice(
      src.indexOf("const carFields"),
      src.indexOf("const realEstateFields"),
    );
    for (const key of [
      "brand",
      "model",
      "condition",
      "year",
      "emirate",
      "city",
      "mileage",
      "transmission",
      "fuelType",
    ]) {
      assert.match(
        carBlock,
        new RegExp(`key:\\s*"${key}"[\\s\\S]{0,180}?required:\\s*true`),
        `${key} should stay required`,
      );
    }
    for (const key of [
      "regionalSpecs",
      "exteriorColor",
      "interiorColor",
      "warranty",
      "accidentHistory",
      "serviceHistory",
      "engineSize",
      "bodyType",
      "drivetrain",
    ]) {
      assert.match(
        carBlock,
        new RegExp(`key:\\s*"${key}"[\\s\\S]{0,220}?required:\\s*false`),
        `${key} should be optional`,
      );
    }
    assert.match(carBlock, /section:\s*"تفاصيل إضافية \(اختياري\)"/);
  });

  it("publish failure scrolls to the first invalid field control", () => {
    const hook = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(hook, /function scrollToFirstError/);
    assert.match(hook, /add-listing-field-\$\{firstKey\}/);
    assert.match(hook, /spec_\$\{/);
    assert.match(hook, /focus\(\{ preventScroll: true \}\)/);
    assert.match(hook, /clearFieldError/);
    assert.doesNotMatch(
      hook,
      /const detailFields = new Set\(\[\s*"title"/,
    );
  });

  it("category form clears sticky field errors and collapses car extras", () => {
    const form = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    const step = read(
      "features/listings/components/add-listing/CategoryFieldsStep.tsx",
    );
    const store = read("services/admin/category-form-store.ts");
    assert.match(form, /onClearError/);
    assert.match(form, /OPTIONAL_DETAILS_SECTION/);
    assert.match(form, /<details/);
    assert.match(form, /carCoreKeys/);
    assert.match(step, /onClearError/);
    assert.match(store, /carPublishOptional/);
    assert.match(store, /forceOptional/);
  });
});
