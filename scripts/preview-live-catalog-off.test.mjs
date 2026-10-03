/**
 * Preview must not re-seed live-mkt into production Neon.
 * Admin can hard-delete leftover live-mkt rows.
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

describe("preview live catalog off (shared Neon)", () => {
  it("defaults OFF on Vercel preview and production", () => {
    const prev = {
      SOOQNA_LIVE_CATALOG: process.env.SOOQNA_LIVE_CATALOG,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
    };
    try {
      delete process.env.SOOQNA_LIVE_CATALOG;

      process.env.VERCEL_ENV = "preview";
      assert.equal(isLiveCatalogEnabled(), false);

      process.env.VERCEL_ENV = "production";
      assert.equal(isLiveCatalogEnabled(), false);

      process.env.SOOQNA_LIVE_CATALOG = "true";
      process.env.VERCEL_ENV = "preview";
      assert.equal(isLiveCatalogEnabled(), true);

      delete process.env.SOOQNA_LIVE_CATALOG;
      delete process.env.VERCEL_ENV;
      process.env.NODE_ENV = "development";
      assert.equal(isLiveCatalogEnabled(), true);
    } finally {
      for (const [key, value] of Object.entries(prev)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it("documents Preview shares Neon in live-catalog helper", () => {
    const src = read("shared/listings/live-catalog-listing.ts");
    assert.match(src, /Preview shares production Neon/);
    assert.match(
      src,
      /VERCEL_ENV === "production" \|\| process\.env\.VERCEL_ENV === "preview"/,
    );
  });

  it("admin can remove live-mkt seed rows", () => {
    assert.match(
      read("services/listings/listing-persistence.ts"),
      /deleteLiveMarketplaceListings/,
    );
    assert.match(
      read("services/listings/live-marketplace-catalog.service.ts"),
      /removeLiveMarketplaceCatalog/,
    );
    const route = read("app/api/admin/listings/live-catalog/route.ts");
    assert.match(route, /action !== "remove"/);
    assert.match(route, /listing_live_catalog_remove/);

    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /handleRemoveLiveCatalog/);
    assert.match(panel, /\/api\/admin\/listings\/live-catalog/);
  });

  it("admin can publish-empty without enabling full live catalog", () => {
    const route = read("app/api/admin/listings/live-catalog/route.ts");
    assert.match(route, /publish-empty/);
    assert.match(route, /publishEmptyCategoryStarters/);
    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /handlePublishEmptyCategories/);
  });
});
