/**
 * Listing form fields must hide inapplicable specs (EV engine size, phone
 * storage on accessories).
 * Run: node --test --experimental-strip-types scripts/listing-field-visibility.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  fieldVisibleForSpecs,
  withVisibilityContext,
} from "../shared/listings/category-field-visibility.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("hideWhen / showWhen visibility", () => {
  it("hides when any hideWhen rule matches (OR)", () => {
    const field = {
      hideWhen: [
        { key: "fuelType", values: ["كهربائي"] },
        { key: "subcategory", values: ["سيارات كهربائية"] },
      ],
    };
    assert.equal(fieldVisibleForSpecs(field, { fuelType: "كهربائي" }), false);
    assert.equal(
      fieldVisibleForSpecs(field, { subcategory: "سيارات كهربائية" }),
      false,
    );
    assert.equal(fieldVisibleForSpecs(field, { fuelType: "بنزين" }), true);
    assert.equal(fieldVisibleForSpecs(field, {}), true);
  });

  it("still requires all showWhen rules (AND)", () => {
    const field = {
      showWhen: [
        { key: "advertiserType", values: ["broker"] },
        { key: "regulatoryAuthority", values: ["DLD"] },
      ],
    };
    assert.equal(
      fieldVisibleForSpecs(field, {
        advertiserType: "broker",
        regulatoryAuthority: "DLD",
      }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(field, { advertiserType: "broker" }),
      false,
    );
  });

  it("hides phone storage/ram/battery on accessories subcategory", () => {
    const phoneField = {
      hideWhen: { key: "subcategory", values: ["إكسسوارات"] },
    };
    const specs = withVisibilityContext(
      { storage: "128 GB" },
      { subcategory: "إكسسوارات" },
    );
    assert.equal(fieldVisibleForSpecs(phoneField, specs), false);
    assert.equal(
      fieldVisibleForSpecs(
        phoneField,
        withVisibilityContext({}, { subcategory: "آيفون" }),
      ),
      true,
    );
  });

  it("drops hidden keys from stored categorySpecs", () => {
    const hydrate = read("shared/listings/listing-form-hydrate.ts");
    assert.match(hydrate, /export function omitHiddenCategorySpecs/);
    assert.match(hydrate, /delete next\[field\.key\]/);
  });
});

describe("category field definitions", () => {
  it("marks engine size hidden for electric cars", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key: "engineSize"/);
    assert.match(src, /hideWhen:/);
    assert.match(src, /fuelType", values: \["كهربائي"\]/);
    assert.match(src, /سيارات كهربائية/);
  });

  it("marks phone-only fields hidden for إكسسوارات", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key: "storage"/);
    assert.match(src, /key: "batteryHealth"/);
    assert.match(src, /values: \["إكسسوارات"\]/);
  });

  it("edit and add forms pass subcategory into category fields", () => {
    const form = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    const step = read(
      "features/listings/components/add-listing/CategoryFieldsStep.tsx",
    );
    const edit = read("features/listings/components/LocalListingEdit.tsx");
    const parse = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    assert.match(form, /subcategory = ""/);
    assert.match(form, /withVisibilityContext/);
    assert.match(step, /subcategory=\{subcategory\}/);
    assert.match(edit, /subcategory=\{listing\.subcategory\}/);
    assert.match(parse, /visibilitySpecs\.subcategory = formSubcategory/);
  });
});
