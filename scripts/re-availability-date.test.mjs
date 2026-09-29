/**
 * Real estate availability / handover: select + date picker (not free text).
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

describe("real estate availability / handover date", () => {
  it("defines availabilityTiming select with ready-made options", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key:\s*"availabilityTiming"/);
    assert.match(src, /section:\s*"موعد التوفر"/);
    assert.match(src, /label:\s*"موعد التوفر \/ التسليم"/);
    assert.match(src, /"متاح الآن"/);
    assert.match(src, /"تاريخ محدد"/);
    assert.match(src, /"قيد الإنشاء"/);
    assert.match(src, /ليس نصاً حراً/);
  });

  it("shows date picker only for specific date; optional handover for under construction", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key:\s*"availabilityDate"/);
    assert.match(src, /type:\s*"date"/);
    assert.match(src, /key:\s*"expectedHandoverDate"/);

    const dateField = {
      showWhen: { key: "availabilityTiming", values: ["تاريخ محدد"] },
    };
    const handoverField = {
      showWhen: { key: "availabilityTiming", values: ["قيد الإنشاء"] },
    };
    assert.equal(
      fieldVisibleForSpecs(dateField, { availabilityTiming: "متاح الآن" }),
      false,
    );
    assert.equal(
      fieldVisibleForSpecs(dateField, { availabilityTiming: "تاريخ محدد" }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(handoverField, {
        availabilityTiming: "قيد الإنشاء",
      }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(handoverField, {
        availabilityTiming: "تاريخ محدد",
      }),
      false,
    );
  });

  it("CategoryFieldsForm supports native date inputs", () => {
    const src = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(src, /field\.type === "date"/);
  });

  it("ListingSpecifications groups availability under موعد التوفر", () => {
    const src = read("features/listings/components/ListingSpecifications.tsx");
    assert.match(src, /موعد التوفر/);
    assert.match(src, /availabilityTiming/);
    assert.match(src, /availabilityDate/);
    assert.match(src, /expectedHandoverDate/);
  });

  it("EN phrases cover availability labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["موعد التوفر / التسليم"], "Availability / handover");
    assert.equal(phrases["متاح الآن"], "Available now");
    assert.equal(phrases["تاريخ محدد"], "Specific date");
    assert.equal(
      phrases["تاريخ التوفر / التسليم"],
      "Availability / handover date",
    );
  });

  it("showcase listings include availabilityTiming", () => {
    const src = read("services/listings/showcase-catalog.ts");
    assert.match(src, /availabilityTiming:\s*"متاح الآن"/);
    assert.match(src, /availabilityTiming:\s*"تاريخ محدد"/);
    assert.match(src, /availabilityDate:\s*"2026-11-01"/);
  });
});
