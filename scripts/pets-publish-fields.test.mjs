/**
 * Animals (pets) publish form must render real fields — not an empty dynamic step.
 * Run: node --test scripts/pets-publish-fields.test.mjs
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

describe("pets listing publish", () => {
  it("registers pets in DYNAMIC_CATEGORY_IDS with animal fields", () => {
    const fields = read("shared/constants/category-fields.ts");
    assert.match(fields, /"pets"/);
    assert.match(fields, /const petFields/);
    assert.match(fields, /key:\s*"animalType"/);
    assert.match(fields, /key:\s*"age"/);
    assert.match(fields, /pets:\s*petFields/);
  });

  it("does not treat featureProfile alone as dynamic form", () => {
    const form = read("features/listings/components/AddListingForm.tsx");
    assert.match(form, /isDynamicCategory\(selectedCategoryId\)/);
    assert.doesNotMatch(
      form,
      /isDynamicCategory\(selectedCategoryId\)\s*\|\|\s*\n?\s*Boolean\(selectedCategory\?\.featureProfile\)/,
    );
  });

  it("surfaces specific submit errors when validation fails", () => {
    const hook = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(hook, /تعذر نشر الإعلان/);
    assert.match(hook, /fieldHints/);
  });

  it("maps pets animalType into subcategory on publish", () => {
    const hook = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(hook, /categoryId === "pets"/);
    assert.match(hook, /animalType/);
  });

  it("seeds animalType from step-1 subcategory for pets", () => {
    const smart = read("shared/listings/listing-form-smart-defaults.ts");
    const utils = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    const form = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(smart, /PET_ANIMAL_TYPES/);
    assert.match(smart, /"animalType",\s*subcategory/);
    assert.match(utils, /inferListingFormSmartSpecs/);
    assert.match(form, /inferListingFormSmartSpecs/);
  });
});
