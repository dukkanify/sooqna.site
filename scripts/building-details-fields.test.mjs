/**
 * Real estate building details: اسم المبنى + تفاصيل المبنى section.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fieldVisibleForSpecs } from "../shared/listings/category-field-visibility.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("real estate building details fields", () => {
  it("realEstateFields include buildingName section and related keys", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key:\s*"buildingName"/);
    assert.match(src, /section:\s*"تفاصيل المبنى"/);
    assert.match(src, /label:\s*"اسم المبنى"/);
    assert.match(src, /key:\s*"unitNumber"/);
    assert.match(src, /key:\s*"totalFloors"/);
    assert.match(src, /key:\s*"floor"/);
    assert.match(
      src,
      /propertyType\",\s*values:\s*\["شقة",\s*"فيلا",\s*"تاون هاوس",\s*"مكتب"\]/,
    );
  });

  it("hides building fields for land; shows for apartment", () => {
    const buildingName = {
      showWhen: {
        key: "propertyType",
        values: ["شقة", "فيلا", "تاون هاوس", "مكتب"],
      },
    };
    const unitNumber = {
      showWhen: {
        key: "propertyType",
        values: ["شقة", "تاون هاوس", "مكتب"],
      },
    };
    assert.equal(
      fieldVisibleForSpecs(buildingName, { propertyType: "أرض" }),
      false,
    );
    assert.equal(
      fieldVisibleForSpecs(buildingName, { propertyType: "شقة" }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(unitNumber, { propertyType: "فيلا" }),
      false,
    );
    assert.equal(
      fieldVisibleForSpecs(unitNumber, { propertyType: "شقة" }),
      true,
    );
  });

  it("CategoryFieldsForm renders field.section headings", () => {
    const src = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(src, /field\.section/);
    assert.match(src, /sectionHeading/);
  });

  it("ListingSpecifications groups real-estate building details", () => {
    const src = read("features/listings/components/ListingSpecifications.tsx");
    assert.match(src, /RE_SPEC_GROUPS/);
    assert.match(src, /تفاصيل المبنى/);
    assert.match(src, /buildingName/);
    assert.match(src, /isRealEstate/);
  });

  it("types expose building fields on RealEstateSpecs and CategoryFieldDefinition", () => {
    const listingTypes = read("types/domain/listing.ts");
    assert.match(listingTypes, /buildingName\?:/);
    assert.match(listingTypes, /unitNumber\?:/);
    assert.match(listingTypes, /totalFloors\?:/);
    const fieldTypes = read("types/domain/category-fields.ts");
    assert.match(fieldTypes, /section\?:/);
  });

  it("EN phrases cover building details labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["تفاصيل المبنى"], "Building details");
    assert.equal(phrases["اسم المبنى"], "Building name");
    assert.equal(phrases["رقم الوحدة"], "Unit number");
    assert.equal(phrases["إجمالي الطوابق"], "Total floors");
  });

  it("showcase apartments include buildingName in categorySpecs", () => {
    const src = read("services/listings/showcase-catalog.ts");
    assert.match(src, /buildingName:\s*"مارينا جيت"/);
    assert.match(src, /buildingName:\s*"برج الإمارات"/);
  });
});
