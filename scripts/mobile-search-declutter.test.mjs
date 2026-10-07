/**
 * Mobile search chrome must stay compact — no stacked chip rails.
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

describe("mobile search declutter", () => {
  it("toolbar drops stacked quick-filter chip rails on mobile", () => {
    const toolbar = read("features/search/components/SearchResultsToolbar.tsx");
    assert.doesNotMatch(toolbar, /SearchQuickFilters/);
    assert.match(toolbar, /SearchFilterChips/);
    assert.match(toolbar, /فلترة sheet/);
  });

  it("active chips stay on one scrollable row on mobile", () => {
    const chips = read("features/search/components/SearchFilterChips.tsx");
    assert.match(chips, /overflow-x-auto/);
    assert.match(chips, /md:flex-wrap/);
    assert.match(chips, /shrink-0/);
  });

  it("search page helper copy is shorter on mobile", () => {
    const page = read("app/search/page.tsx");
    assert.match(page, /hidden max-w-xl[\s\S]*md:block/);
    assert.match(page, /md:hidden/);
    assert.match(page, /استخدم فلترة لتضييق النتائج/);
  });

  it("mobile filter sheet still owns emirate/price/category controls", () => {
    const filters = read("features/search/components/SearchFilters.tsx");
    assert.match(filters, /easy/);
    assert.match(filters, /تطبيق الفلاتر|عرض النتائج/);
    assert.match(filters, /sticky top-\[4\.25rem\].*md:hidden/s);
  });
});
