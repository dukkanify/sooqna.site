/**
 * Professional bilingual listing copy: Arabic is source of truth,
 * optional seller English, glossary MT only for empty counterparts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  enrichListingCopy,
  sellerEnglishPrefill,
  translateArabicToEnglish,
} from "../shared/i18n/listing-translator.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("listing bilingual copy translator", () => {
  it("preserves brands, models, years, storage, and prices", () => {
    const out = translateArabicToEnglish(
      "آيفون 16 برو ماكس 256GB بحالة ممتازة — 4200 درهم",
    );
    assert.match(out, /iPhone/);
    assert.match(out, /16/);
    assert.match(out, /Pro Max/);
    assert.match(out, /256GB/);
    assert.match(out, /4200/);
    assert.doesNotMatch(out, /4200 درهم/);
  });

  it("does not rewrite already-English titles", () => {
    assert.equal(
      translateArabicToEnglish("MacBook Pro M3 14-inch"),
      "MacBook Pro M3 14-inch",
    );
  });

  it("never overwrites Arabic or seller English", () => {
    const created = enrichListingCopy({
      title: "تويوتا كامري 2022 بحالة ممتازة",
      description: "سيارة بدون حوادث وفل أوبشن",
    });
    assert.equal(created.title, "تويوتا كامري 2022 بحالة ممتازة");
    assert.equal(created.description, "سيارة بدون حوادث وفل أوبشن");
    assert.equal(created.titleTranslationSource, "machine");
    assert.ok(created.titleEnglish?.includes("2022"));
    assert.match(created.titleEnglish ?? "", /Toyota/);
    assert.match(created.titleEnglish ?? "", /Camry/);
    assert.match(created.titleEnglish ?? "", /excellent/i);
    assert.match(created.descriptionEnglish ?? "", /accident-free/);
    assert.match(created.descriptionEnglish ?? "", /full option/);

    const withSeller = enrichListingCopy(
      {
        title: "تويوتا كامري 2022 بحالة ممتازة",
        description: "سيارة بدون حوادث وفل أوبشن",
        titleEnglish: "My Camry — seller wording",
        descriptionEnglish: "Seller wrote this description.",
      },
      created,
    );
    assert.equal(withSeller.titleEnglish, "My Camry — seller wording");
    assert.equal(withSeller.titleTranslationSource, "seller");
    assert.equal(
      withSeller.descriptionEnglish,
      "Seller wrote this description.",
    );
    assert.equal(withSeller.descriptionTranslationSource, "seller");

    const arabicEdited = enrichListingCopy(
      {
        title: "تويوتا كامري 2023 للبيع",
        description: "تحديث الوصف العربي",
      },
      withSeller,
    );
    assert.equal(arabicEdited.title, "تويوتا كامري 2023 للبيع");
    assert.equal(arabicEdited.titleEnglish, "My Camry — seller wording");
    assert.equal(arabicEdited.titleTranslationSource, "seller");
    assert.equal(
      arabicEdited.descriptionEnglish,
      "Seller wrote this description.",
    );
  });

  it("refreshes machine English when Arabic changes", () => {
    const first = enrichListingCopy({
      title: "شقة مفروشة للإيجار",
      description: "موقع ممتاز في دبي",
    });
    assert.equal(first.titleTranslationSource, "machine");
    const second = enrichListingCopy(
      {
        title: "فيلا للبيع في الشارقة",
        description: first.description,
        titleEnglish: first.titleEnglish,
        titleTranslationSource: first.titleTranslationSource,
        descriptionEnglish: first.descriptionEnglish,
        descriptionTranslationSource: first.descriptionTranslationSource,
      },
      first,
    );
    assert.equal(second.titleTranslationSource, "machine");
    assert.notEqual(second.titleEnglish, first.titleEnglish);
    assert.match(second.titleEnglish ?? "", /villa/i);
    assert.match(second.titleEnglish ?? "", /Sharjah/);
    assert.equal(second.descriptionEnglish, first.descriptionEnglish);
  });

  it("does not prefill machine English into the seller form", () => {
    const listing = enrichListingCopy({
      title: "قطط للبيع",
      description: "قطط ملقحة في دبي",
    });
    const prefill = sellerEnglishPrefill(listing);
    assert.equal(prefill.titleEnglish, undefined);
    assert.equal(prefill.descriptionEnglish, undefined);
  });

  it("shows a machine hint in English UI and not for seller copy", () => {
    const machine = enrichListingCopy({
      title: "آيباد برو للبيع",
      description: "جهاز بحالة ممتازة",
    });
    assert.equal(machine.titleTranslationSource, "machine");
    assert.match(machine.titleEnglish ?? "", /iPad/i);
    assert.match(machine.descriptionEnglish ?? "", /excellent/i);

    const seller = enrichListingCopy(
      {
        title: machine.title,
        description: machine.description,
        titleEnglish: "iPad Pro — seller",
        descriptionEnglish: "Seller description",
      },
      machine,
    );
    assert.equal(seller.titleTranslationSource, "seller");
    assert.equal(seller.titleEnglish, "iPad Pro — seller");
  });
});

describe("listing bilingual copy wiring", () => {
  it("persists translation on upsert/patch and collects optional English fields", () => {
    const copy = read("shared/i18n/listing-copy.ts");
    assert.match(copy, /translateArabicToEnglish/);
    assert.match(copy, /listingCopyIsMachine/);
    assert.match(copy, /source === "machine"/);

    const store = read("services/listings/listing-store.ts");
    assert.match(store, /enrichListingCopy\(listing, previous\)/);
    assert.match(store, /enrichListingCopy\(next, previous\)/);

    const addForm = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(addForm, /formData\.get\("titleEnglish"\)/);
    assert.match(addForm, /formData\.get\("descriptionEnglish"\)/);

    const details = read(
      "features/listings/components/add-listing/ListingDetailsStep.tsx",
    );
    assert.match(details, /ListingEnglishCopyFields/);

    const categoryForm = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(categoryForm, /ListingEnglishCopyFields/);

    const patchRoute = read("app/api/listings/[id]/route.ts");
    assert.match(patchRoute, /titleEnglish/);
    assert.match(patchRoute, /descriptionEnglish/);
  });
});
