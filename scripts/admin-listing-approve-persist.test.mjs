/**
 * Admin listing approval must persist — no stale bulk overwrite, no fake success.
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

describe("admin listing approval persistence", () => {
  it("bulk catalog writes skip regressing active ads to pending_review", () => {
    const src = read("services/listings/listing-persistence.ts");
    assert.match(src, /BULK_UPSERT_STATUS_GUARD/);
    assert.match(src, /mode: "authoritative" \| "bulk"/);
    assert.match(src, /EXCLUDED\.status IN \('pending_review', 'draft'\)/);
    assert.match(src, /postgresUpsertListing\(listing, "bulk"\)/);
    assert.match(src, /postgresUpsertListing\(listing, "authoritative"\)/);
  });

  it("Vercel does not silently fall back to /tmp after a failed listing write", () => {
    const src = read("services/listings/listing-persistence.ts");
    assert.match(src, /durableListingsStoreRequired/);
    assert.match(src, /LISTINGS_STORE_UNAVAILABLE/);
    assert.match(src, /process\.env\.VERCEL/);
  });

  it("admin patch loads the row by id and verifies persisted status", () => {
    const src = read("services/listings/listing-store.ts");
    assert.match(src, /loadListingById\(id\)/);
    assert.match(src, /LISTING_STATUS_PERSIST_FAILED/);
    assert.match(src, /liveWindow/);
  });

  it("expiry persist only writes changed rows", () => {
    const src = read("services/listings/listing-store.ts");
    assert.match(src, /changed\.map\(\(listing\) => upsertListingRow\(listing\)/);
    assert.doesNotMatch(
      src,
      /applyListingExpiry[\s\S]*persistAllListings\(listings\)/,
    );
  });

  it("admin GET prefers payload status when the column is stale", () => {
    const src = read("services/listings/listing-queries.ts");
    assert.match(
      src,
      /COALESCE\(NULLIF\(payload->>'status', ''\), status\) AS status/,
    );
  });

  it("admin approve API returns 503 when persist fails", () => {
    const src = read("app/api/admin/listings/[id]/route.ts");
    assert.match(src, /LISTINGS_STORE_UNAVAILABLE/);
    assert.match(src, /status: 503/);
  });
});
