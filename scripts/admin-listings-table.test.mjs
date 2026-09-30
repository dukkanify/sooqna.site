/**
 * Admin listings desk: structured table + search/filters.
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

describe("admin listings table desk", () => {
  it("AdminListingsPanel renders required table columns", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(src, /admin-listings-table/);
    assert.match(src, /رقم الإعلان/);
    assert.match(src, /المعلن/);
    assert.match(src, /التصنيف/);
    assert.match(src, /المشاهدات/);
    assert.match(src, /تاريخ النشر/);
    assert.match(src, /الإجراءات/);
    assert.match(src, /listing\.views/);
    assert.match(src, /useSearchParams/);
  });

  it("AdminListingRecord includes views", () => {
    const src = read("types/domain/admin.ts");
    assert.match(src, /views\?:/);
  });

  it("loadAdminListingRecords attaches view scores", () => {
    const src = read("services/listings/listing-queries.ts");
    assert.match(src, /getListingViewScores/);
    assert.match(src, /views:\s*viewScores\.get/);
  });

  it("page title/description describe organized listings desk", () => {
    const src = read("app/admin/listings/page.tsx");
    assert.match(src, /إدارة الإعلانات/);
    assert.match(src, /رقم الإعلان/);
    assert.match(src, /بحث وفلاتر/);
  });

  it("EN phrases cover new desk labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["إدارة الإعلانات"], "Ad management");
    assert.equal(phrases["رقم الإعلان"], "Ad number");
    assert.equal(phrases["المشاهدات"], "Views");
  });
});
