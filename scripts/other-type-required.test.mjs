/**
 * «حدد النوع (أخرى)» is visible and required only when the parent type is Other.
 * Choosing a real type (كتب, كنب, قطط, …) must not block publish.
 * Run: node --test --experimental-strip-types scripts/other-type-required.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  fieldRequiredForSpecs,
  fieldVisibleForSpecs,
  isOtherDetailField,
  isOtherOptionValue,
  parentKeyForOtherField,
  withImplicitOtherShowWhen,
} from "../shared/listings/category-field-visibility.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

const otherField = {
  key: "furnitureTypeOther",
  label: "حدد النوع (أخرى)",
  required: true,
};

const snapshotWithoutShowWhen = [
  {
    key: "furnitureType",
    label: "النوع",
    type: "select",
    required: true,
    options: [
      { label: "كتب", value: "كتب" },
      { label: "أخرى", value: "other" },
    ],
  },
  {
    key: "furnitureTypeOther",
    label: "حدد النوع (أخرى)",
    type: "text",
    required: true,
  },
];

describe("Other type field visibility", () => {
  it("treats أخرى and other as the same option", () => {
    assert.equal(isOtherOptionValue("أخرى"), true);
    assert.equal(isOtherOptionValue("other"), true);
    assert.equal(isOtherOptionValue("OTHER"), true);
    assert.equal(isOtherOptionValue("كتب"), false);
    assert.equal(isOtherOptionValue("كنب"), false);
  });

  it("detects Other-detail companions from key and Arabic label", () => {
    assert.equal(isOtherDetailField(otherField), true);
    assert.equal(parentKeyForOtherField(otherField), "furnitureType");
    assert.equal(isOtherDetailField({ key: "condition", label: "الحالة" }), false);
  });

  it("hides and does not require Other when a real type like كتب is selected", () => {
    assert.equal(
      fieldVisibleForSpecs(otherField, { furnitureType: "كتب" }),
      false,
    );
    assert.equal(
      fieldRequiredForSpecs(otherField, { furnitureType: "كتب" }),
      false,
    );
    assert.equal(
      fieldVisibleForSpecs(otherField, { furnitureType: "كنب" }),
      false,
    );
    assert.equal(fieldVisibleForSpecs(otherField, { furnitureType: "" }), false);
  });

  it("shows and requires Other only for other / أخرى", () => {
    assert.equal(
      fieldVisibleForSpecs(otherField, { furnitureType: "other" }),
      true,
    );
    assert.equal(
      fieldRequiredForSpecs(otherField, { furnitureType: "other" }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(otherField, { furnitureType: "أخرى" }),
      true,
    );
    assert.equal(
      fieldRequiredForSpecs(otherField, { furnitureType: "أخرى" }),
      true,
    );
  });

  it("matches showWhen other against Arabic أخرى and the reverse", () => {
    const englishRule = {
      key: "furnitureTypeOther",
      label: "حدد النوع (أخرى)",
      required: true,
      showWhen: { key: "furnitureType", values: ["other"] },
    };
    const arabicRule = {
      ...englishRule,
      showWhen: { key: "furnitureType", values: ["أخرى"] },
    };
    assert.equal(
      fieldVisibleForSpecs(englishRule, { furnitureType: "أخرى" }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(arabicRule, { furnitureType: "other" }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(englishRule, { furnitureType: "كتب" }),
      false,
    );
  });

  it("restores showWhen on admin snapshots that dropped it", () => {
    const prepared = withImplicitOtherShowWhen(snapshotWithoutShowWhen);
    const restored = prepared.find((field) => field.key === "furnitureTypeOther");
    assert.deepEqual(restored?.showWhen, {
      key: "furnitureType",
      values: ["other", "أخرى"],
    });
    assert.equal(
      fieldVisibleForSpecs(restored, { furnitureType: "كتب" }),
      false,
    );
    assert.equal(
      fieldRequiredForSpecs(restored, { furnitureType: "كتب" }),
      false,
    );
    assert.equal(
      fieldVisibleForSpecs(restored, { furnitureType: "other" }),
      true,
    );
  });
});

describe("Other type wiring", () => {
  it("furniture and pets Other fields list both other and أخرى", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key: "furnitureTypeOther"/);
    assert.match(src, /values: \["other", "أخرى"\]/);
    assert.match(src, /key: "animalTypeOther"/);
  });

  it("parse and add-listing form gate Other with shared helpers", () => {
    const parse = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    const form = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    const store = read("services/admin/category-form-store.ts");
    assert.match(parse, /withImplicitOtherShowWhen/);
    assert.match(parse, /fieldRequiredForSpecs/);
    assert.match(form, /withImplicitOtherShowWhen/);
    assert.match(form, /fieldVisibleForSpecs/);
    assert.match(store, /withImplicitOtherShowWhen/);
    assert.match(store, /getFormTemplateFields/);
  });

  it("admin form editor keeps showWhen/hideWhen on save", () => {
    const panel = read(
      "features/admin/components/AdminCategoryFormsPanel.tsx",
    );
    const route = read("app/api/admin/category-forms/route.ts");
    assert.match(panel, /showWhen: field\.showWhen/);
    assert.match(panel, /hideWhen: field\.hideWhen/);
    assert.match(route, /hideWhen: showWhenSchema/);
  });
});
