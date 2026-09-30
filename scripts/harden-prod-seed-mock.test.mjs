/**
 * Production seed/mock authenticity guards:
 * - Live catalog opt-in (off in production by default)
 * - Public queries hide live seeds when disabled
 * - Mock checkout never auto-allows on Preview/Production
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { isLiveCatalogEnabled } from "../shared/listings/live-catalog-listing.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("live catalog opt-in", () => {
  it("isLiveCatalogEnabled defaults off in Vercel production", () => {
    const prev = {
      SOOQNA_LIVE_CATALOG: process.env.SOOQNA_LIVE_CATALOG,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
    };
    try {
      delete process.env.SOOQNA_LIVE_CATALOG;
      process.env.VERCEL_ENV = "production";
      assert.equal(isLiveCatalogEnabled(), false);

      process.env.SOOQNA_LIVE_CATALOG = "true";
      assert.equal(isLiveCatalogEnabled(), true);

      process.env.SOOQNA_LIVE_CATALOG = "false";
      process.env.VERCEL_ENV = "preview";
      assert.equal(isLiveCatalogEnabled(), false);

      // Preview shares production Neon — default OFF (same as production).
      delete process.env.SOOQNA_LIVE_CATALOG;
      process.env.VERCEL_ENV = "preview";
      assert.equal(isLiveCatalogEnabled(), false);
    } finally {
      for (const [key, value] of Object.entries(prev)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it("ensureLiveMarketplaceCatalogPublished short-circuits when disabled", () => {
    const src = read("services/listings/live-marketplace-catalog.service.ts");
    assert.match(src, /isLiveCatalogEnabled/);
    assert.match(src, /if \(!isLiveCatalogEnabled\(\)\) return 0/);
    assert.match(src, /v9-relative-posted-at/);
  });

  it("public catalog hides live seeds when disabled", () => {
    const queries = read("services/listings/listing-queries.ts");
    assert.match(queries, /LIVE_MARKETPLACE_LISTING_SQL/);
    assert.match(queries, /isLiveCatalogEnabled/);
    assert.match(queries, /isLiveCatalogListing/);
    assert.match(queries, /publicCatalogExclusionSql/);
    assert.match(
      queries,
      /!isLiveCatalogEnabled\(\) && isLiveCatalogListing\(listing\)/,
    );

    const details = read("services/listings/listings.service.ts");
    assert.match(details, /isLiveCatalogEnabled/);
    assert.match(details, /isLiveCatalogListing/);
  });

  it("seed postedAt is relative to now", () => {
    const catalog = read("services/listings/live-marketplace-catalog.ts");
    assert.match(catalog, /Date\.now\(\)/);
    assert.match(catalog, /hoursAgo/);
    assert.doesNotMatch(
      catalog,
      /postedAt = `2026-08-\$\{String\(postedDay\)/,
    );
  });
});

describe("mock checkout guards", () => {
  it("payment-config is opt-in only (no Preview auto-allow)", () => {
    const src = read("services/payments/payment-config.ts");
    assert.match(src, /never auto-enable on Preview/);
    assert.match(src, /ALLOW_MOCK_CHECKOUT === "true"/);
    assert.match(
      src,
      /VERCEL_ENV === "production" \|\| process\.env\.VERCEL_ENV === "preview"/,
    );
    // Must not auto-allow solely because VERCEL_ENV === "preview"
    assert.doesNotMatch(
      src,
      /VERCEL_ENV === "preview"\) return true/,
    );
  });
});
