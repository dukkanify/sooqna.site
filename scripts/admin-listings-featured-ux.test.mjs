/**
 * Admin listings desk: no text truncation + featured column/filter/access.
 * Run: npm test
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

describe("admin listings featured UX", () => {
  it("table wraps text instead of truncating title/seller/city", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(src, /admin-listings-cell-wrap/);
    assert.match(src, /admin-listings-cell-title/);
    assert.doesNotMatch(
      src,
      /max-w-\[9rem\] truncate|max-w-\[8rem\] truncate|max-w-\[7rem\] truncate/,
    );
    // Title cell should not use truncate class.
    assert.doesNotMatch(
      src,
      /<p className="truncate font-semibold text-ink">/,
    );
  });

  it("exposes featured filter, column, and public featured page link", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(src, /المميزة فقط/);
    assert.match(src, /statusFilter === "featured"/);
    assert.match(src, /<th>التمييز<\/th>/);
    assert.match(src, /href="\/featured"/);
    assert.match(src, /صفحة المميزة على الموقع/);
    assert.match(src, /كيف نميّز الإعلان المميز؟/);
    assert.match(src, /featuredUntil/);
  });

  it("feature toggle is a primary row action", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    const featureBtn = src.indexOf('{featuredLive ? "إلغاء التمييز" : "تمييز"}');
    const moreBtn = src.indexOf('{actionsOpen ? "إخفاء" : "المزيد"}');
    assert.ok(featureBtn > 0);
    assert.ok(moreBtn > featureBtn);
  });

  it("AdminListingRecord and loaders expose featuredUntil", () => {
    const types = read("types/domain/admin.ts");
    const store = read("services/listings/listing-store.ts");
    const queries = read("services/listings/listing-queries.ts");
    assert.match(types, /featuredUntil\?:/);
    assert.match(store, /featuredUntil: media\.featuredUntil/);
    assert.match(queries, /featured_until/);
    assert.match(store, /featuredListingDays/);
  });

  it("EN phrases cover featured desk labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["المميزة فقط"], "Featured only");
    assert.equal(phrases["التمييز"], "Featured");
    assert.equal(phrases["صفحة المميزة على الموقع"], "Featured page on the site");
    assert.equal(phrases["كيف نميّز الإعلان المميز؟"], "How do we mark a featured listing?");
  });
});
