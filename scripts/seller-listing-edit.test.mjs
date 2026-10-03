/**
 * Seller listing edit — synced local-* ads must not use the localStorage editor.
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

describe("seller listing edit href", () => {
  it("defines getListingEditPath that prefers the server editor for synced ads", () => {
    const src = read("shared/listings/listing-url.ts");
    assert.match(src, /export function getListingEditPath/);
    assert.match(src, /options\?: \{ synced\?: boolean \}/);
    assert.match(src, /\/listings\/local\/\$\{listing\.id\}\/edit/);
    assert.match(src, /\/listings\/\$\{key\}\/edit/);
  });

  it("dashboard and owner banner no longer key edit off local- prefix alone", () => {
    const dashboard = read("features/dashboard/components/MyListingsDashboard.tsx");
    const banner = read(
      "features/listings/components/ListingOwnerStatusBanner.tsx",
    );
    assert.match(dashboard, /getListingEditPath/);
    assert.match(dashboard, /synced: listings\.some/);
    assert.doesNotMatch(dashboard, /startsWith\("local-"\)[\s\S]{0,80}listings\/local\/\$\{listing\.id\}\/edit/);
    assert.match(banner, /getListingEditPath\(listing, \{ synced: true \}\)/);
  });

  it("local edit page redirects synced catalog ads to the server editor", () => {
    const localEdit = read("app/listings/local/[id]/edit/page.tsx");
    const serverEdit = read("app/listings/[slug]/edit/page.tsx");
    assert.match(localEdit, /getListingById/);
    assert.match(localEdit, /getListingEditPath\(stored, \{ synced: true \}\)/);
    assert.match(localEdit, /redirect\(/);
    assert.match(serverEdit, /getListingById/);
    assert.match(serverEdit, /force-dynamic/);
  });
});
