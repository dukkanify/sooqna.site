/**
 * Service «حسب عرض سعر» must not require a numeric AED price (min 1).
 * Run: node --test --experimental-strip-types scripts/quote-pricing.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  isQuotePricingValue,
  quotePricingFromFormData,
  quotePricingFromSpecs,
} from "../shared/listings/quote-pricing.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("quote pricing skips AED amount", () => {
  it("detects quote values from live API and Arabic labels", () => {
    assert.equal(isQuotePricingValue("quote"), true);
    assert.equal(isQuotePricingValue("QUOTE"), true);
    assert.equal(isQuotePricingValue("حسب عرض سعر"), true);
    assert.equal(isQuotePricingValue("on_request"), true);
    assert.equal(isQuotePricingValue("hourly"), false);
    assert.equal(isQuotePricingValue("visit"), false);
    assert.equal(isQuotePricingValue(""), false);
  });

  it("reads pricingBasis from specs and FormData", () => {
    assert.equal(quotePricingFromSpecs({ pricingBasis: "quote" }), true);
    assert.equal(quotePricingFromSpecs({ pricingBasis: "حسب عرض سعر" }), true);
    assert.equal(quotePricingFromSpecs({ pricingBasis: "hourly" }), false);
    assert.equal(quotePricingFromSpecs({ serviceCategory: "quote" }), false);

    const quoteForm = new FormData();
    quoteForm.set("spec_pricingBasis", "quote");
    assert.equal(quotePricingFromFormData(quoteForm), true);

    const hourlyForm = new FormData();
    hourlyForm.set("spec_pricingBasis", "hourly");
    assert.equal(quotePricingFromFormData(hourlyForm), false);
  });

  it("parser and publish paths skip price when quote is selected", () => {
    const utils = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    assert.match(utils, /quotePricingFromFormData/);
    assert.match(utils, /isJobs \|\| quotePricingFromFormData/);
    assert.match(utils, /skipPrice/);
    assert.match(
      utils,
      /if \(!skipPrice\) \{[\s\S]*errors\.price = "اكتب سعراً صحيحاً أكبر من صفر\."/,
    );

    const add = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(add, /parsed\.skipPrice \? 0 : Number\(formData\.get\("price"/);

    const edit = read("features/listings/components/useEditListingForm.ts");
    assert.match(edit, /parsed\.skipPrice/);

    const admin = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(admin, /parsed\.skipPrice \? 0/);

    const adminApi = read("app/api/admin/listings/route.ts");
    assert.match(adminApi, /quotePricingFromSpecs\(create\.categorySpecs\)/);
  });

  it("hides the required min=1 AED input when quote is selected", () => {
    const form = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(form, /quotePricingFromSpecs/);
    assert.match(form, /quotePricing \? \(/);
    assert.match(form, /name="price" type="hidden" value="0"/);
    assert.match(form, /min="1"/);
    assert.match(form, /حسب عرض سعر — لا يُطلب مبلغ بالدرهم/);
    assert.match(form, /priceMode: isJobs \? "salary" : quotePricing \? "quote"/);
  });

  it("shows حسب عرض سعر instead of 0 AED on listing surfaces", () => {
    const price = read("shared/components/ListingPrice.tsx");
    assert.match(price, /listingUsesQuotePricing/);
    assert.match(price, /QUOTE_PRICING_LABEL_AR/);

    const fields = read("shared/constants/category-fields.ts");
    assert.match(fields, /key:\s*"pricingBasis"/);
    assert.match(fields, /value:\s*"quote"/);
    assert.match(fields, /label:\s*"حسب عرض سعر"/);

    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["حسب عرض سعر"], "Quote on request");
    assert.equal(phrases["طريقة احتساب السعر"], "How the price is calculated");
    assert.ok(
      phrases["حسب عرض سعر — لا يُطلب مبلغ بالدرهم. سيظهر للمشترين طلب عرض سعر."],
    );
  });
});
