/**
 * Inline data: photos must be promoted to Blob before card slim strips them.
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

describe("listing inline media repair for public cards", () => {
  it("repairs data: covers before slim in public listing queries", () => {
    const repair = read("services/listings/listing-inline-media-repair.ts");
    const queries = read("services/listings/listing-queries.ts");
    const details = read("services/listings/listings.service.ts");
    const feed = read("services/listings/home-feed.ts");

    assert.match(repair, /persistRepairedInlineListingMedia/);
    assert.match(repair, /repairInlineMediaForPublicRows/);
    assert.match(repair, /materializeInlineListingImages/);
    assert.match(queries, /repairInlineMediaForPublicRows/);
    assert.match(details, /persistRepairedInlineListingMedia/);
    assert.match(feed, /sooqna-home-feed-v38-blob-optimize/);
    assert.match(repair, /Does NOT invent Unsplash/);
    assert.doesNotMatch(repair, /temporaryCoverUrlsForListing/);
  });
});
