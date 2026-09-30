/**
 * Listing count parity: public badges and admin KPIs share one
 * “real marketplace” definition (no showcase / fixtures / live-mkt).
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

describe("unify listing counts", () => {
  it("exports MARKETPLACE_LISTING_EXCLUSION_SQL matching isMarketplaceListing", () => {
    const stats = read("services/listings/listing-stats.ts");
    assert.match(stats, /export const MARKETPLACE_LISTING_EXCLUSION_SQL/);
    assert.match(stats, /LIVE_MARKETPLACE_LISTING_SQL/);
    assert.match(stats, /SHOWCASE_LISTING_SQL/);
    assert.match(stats, /FIXTURE_LISTING_SQL/);
    assert.match(stats, /if \(isLiveCatalogListing\(listing\)\) return false/);
  });

  it("public COUNT helpers always use marketplace exclusion (not env-gated)", () => {
    const queries = read("services/listings/listing-queries.ts");
    assert.match(queries, /marketplaceCountExclusionSql/);
    assert.match(queries, /MARKETPLACE_LISTING_EXCLUSION_SQL/);
    assert.match(queries, /isMarketplaceListing/);

    // Active public total must use marketplace exclusion SQL
    const publicCount = queries.match(
      /export async function countActivePublicListings\([\s\S]*?\n\}/,
    )?.[0];
    assert.ok(publicCount, "countActivePublicListings exists");
    assert.match(publicCount, /marketplaceCountExclusionSql/);
    assert.match(publicCount, /isMarketplaceListing/);
    assert.doesNotMatch(publicCount, /publicCatalogExclusionSql/);

    // Category countWhere path uses marketplace exclusion when excluding fixtures
    const countWhere = queries.match(
      /function countWhere\([\s\S]*?\n\}/,
    )?.[0];
    assert.ok(countWhere, "countWhere exists");
    assert.match(countWhere, /marketplaceCountExclusionSql/);

    // Emirate counts use marketplace exclusion
    const emirate = queries.match(
      /export async function countActiveListingsByEmirate\([\s\S]*?\n\}/,
    )?.[0];
    assert.ok(emirate, "countActiveListingsByEmirate exists");
    assert.match(emirate, /marketplaceCountExclusionSql/);
  });

  it("admin KPI hints document parity with public active count", () => {
    const dash = read("services/admin/admin-dashboard.service.ts");
    assert.match(dash, /نفس عدّ الموقع العام/);
    assert.match(dash, /status=marketplace/);
  });

  it("admin desk labels distinguish marketplace from seed inventory", () => {
    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /الكل \(سوق \+ live-mkt \+ تجريبي\)/);
    assert.match(panel, /value: "marketplace"/);
  });
});
