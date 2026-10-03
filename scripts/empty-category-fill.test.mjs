/**
 * Empty-category starters: fill electronics/pets (etc.) without enabling
 * the full SOOQNA_LIVE_CATALOG flood for categories that already have real ads.
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

describe("empty category starter fill", () => {
  it("publishes starters only for empty marketplace categories", () => {
    const src = read("services/listings/empty-category-starters.ts");
    assert.match(src, /ensureEmptyCategoryStartersPublished/);
    assert.match(src, /getEmptyMarketplaceCategoryIds/);
    assert.match(src, /MARKETPLACE_LISTING_EXCLUSION_SQL/);
    assert.match(src, /isMarketplaceListing/);
    assert.match(src, /insertListingsIfMissing/);
  });

  it("public browse allows live-mkt only when querying an empty category", () => {
    const queries = read("services/listings/listing-queries.ts");
    assert.match(queries, /ensureEmptyCategoryStartersPublished/);
    assert.match(queries, /cachedEmptyCategoryIds/);
    assert.match(
      queries,
      /NOT \$\{LIVE_MARKETPLACE_LISTING_SQL\} OR category_id =/,
    );
    assert.match(queries, /isLiveCatalogVisibleForEmptyCategories/);
  });

  it("admin can publish-empty without SOOQNA_LIVE_CATALOG=true", () => {
    const route = read("app/api/admin/listings/live-catalog/route.ts");
    assert.match(route, /publish-empty/);
    assert.match(route, /publishEmptyCategoryStarters/);
    assert.match(route, /listing_live_catalog_publish_empty/);

    const service = read(
      "services/listings/live-marketplace-catalog.service.ts",
    );
    assert.match(service, /publishEmptyCategoryStarters/);
    assert.match(service, /force: true/);

    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /handlePublishEmptyCategories/);
    assert.match(panel, /ملء الأقسام الفارغة/);
  });

  it("public category badges merge starter counts for empty categories", () => {
    const store = read("services/categories/category-store.ts");
    assert.match(store, /countLiveCatalogStartersByCategory/);
    assert.match(store, /sooqna-category-counts-v5-empty-fill/);
    assert.match(store, /getEmptyMarketplaceCategoryIds/);
  });

  it("detail pages allow empty-category live-mkt slugs", () => {
    const details = read("services/listings/listings.service.ts");
    assert.match(details, /isLiveCatalogVisibleForEmptyCategories/);
    assert.match(details, /getEmptyMarketplaceCategoryIds/);
  });

  it("keeps full-catalog ensure gated behind isLiveCatalogEnabled", () => {
    const service = read(
      "services/listings/live-marketplace-catalog.service.ts",
    );
    assert.match(
      service,
      /export async function ensureLiveMarketplaceCatalogPublished[\s\S]*?if \(!isLiveCatalogEnabled\(\)\) return 0/,
    );
  });
});
