/**
 * Jobs/quote prices, search header, video chip, and spec chrome must localize.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("listing price and search English chrome", () => {
  it("maps leftover marketplace chrome phrases", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["الراتب حسب الاتفاق"], "Salary by agreement");
    assert.equal(phrases["حسب عرض سعر"], "Quote on request");
    assert.equal(phrases["بحث السوق"], "Marketplace search");
    assert.equal(phrases["اعثر على الإعلان المناسب"], "Find the right listing");
    assert.equal(phrases["فيديو"], "Video");
    assert.equal(phrases["عرض الفيديو"], "View video");
    assert.equal(phrases["إصدار الجهاز"], "Device version");
    assert.equal(phrases["عدد الشُتر"], "Shutter count");
    assert.equal(phrases["العدسة المرفقة"], "Included lens");
    assert.equal(phrases["حدد الموديل (أخرى)"], "Specify model (other)");
    assert.equal(phrases["المقاس / الحجم"], "Size");
    assert.equal(phrases["الاتصال"], "Connectivity");
    assert.equal(phrases["الأسطوانات"], "Cylinders");
    assert.equal(phrases["القدرة"], "Horsepower");
    assert.equal(phrases["سلكي"], "Wired");
    assert.equal(phrases["جيد"], "Good");
    assert.equal(phrases["ضعيف"], "Poor");
    assert.equal(phrases["وكيل"], "Agent");
    assert.equal(phrases["أكتوبر"], "October");
  });

  it("localizes jobs fallback and quote labels through ListingPrice", () => {
    const src = read("shared/components/ListingPrice.tsx");
    assert.match(src, /useTx/);
    assert.match(src, /t\("الراتب حسب الاتفاق"\)/);
    assert.match(src, /t\(QUOTE_PRICING_LABEL_AR\)/);
  });

  it("localizes the search page header through tx", () => {
    const src = read("app/search/page.tsx");
    const filters = read("features/search/components/SearchFilters.tsx");
    const quick = read("features/search/components/SearchQuickFilters.tsx");
    assert.match(src, /tx\(locale, "بحث السوق"\)/);
    assert.match(src, /tx\(locale, `نتائج: \$\{selectedFilters\.query\}`\)/);
    assert.match(src, /tx\(locale, "اعثر على الإعلان المناسب"\)/);
    assert.match(filters, /t\("كل التصنيفات"\)/);
    assert.match(quick, /t\("كل التصنيفات"\)/);
  });

  it("keeps the gallery video chip inside LocalizedTree", () => {
    const src = read("features/listings/components/ListingGallery.tsx");
    assert.match(src, /LocalizedTree[\s\S]*فيديو/);
  });

  it("formats spec dates with Latin digits and translates year-bearing dates", () => {
    const display = read("shared/listings/spec-display.ts");
    const txSrc = read("shared/i18n/tx.ts");
    assert.match(display, /ARABIC_MONTHS/);
    assert.match(display, /date\.getDate\(\)/);
    assert.doesNotMatch(display, /toLocaleDateString\("ar-AE"/);
    assert.ok(txSrc.includes("(?: (\\\\d{4}))?$"));
    assert.ok(txSrc.includes("^عرض صورة (\\d+)$"));
  });
});
