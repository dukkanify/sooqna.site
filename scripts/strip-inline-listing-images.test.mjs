/**
 * Card payloads must never embed data:/blob: images (SSR HTML size).
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

describe("strip inline listing images from card payloads", () => {
  it("slimListingForCard rejects data/blob covers and uses product gallery", () => {
    const src = read("services/listings/listing-card-model.ts");
    assert.match(src, /export function isInlineListingImageUrl/);
    assert.match(src, /startsWith\("data:"\)/);
    assert.match(src, /startsWith\("blob:"\)/);
    assert.match(src, /galleryForListingProduct/);
    assert.match(src, /remoteCoverImage/);
    assert.match(src, /card-cover/);
  });

  it("home feed cover candidates skip inline data URLs", () => {
    const feed = read("services/listings/home-feed.ts");
    assert.match(feed, /startsWith\("data:"\)/);
    assert.match(feed, /startsWith\("blob:"\)/);
    assert.match(feed, /sooqna-home-feed-v33-remote-covers/);
  });

  it("getListingImages omits inline data/blob URLs", () => {
    const src = read("features/listings/components/listing-card.utils.ts");
    assert.match(src, /startsWith\("data:"\)/);
    assert.match(src, /startsWith\("blob:"\)/);
  });

  it("public listing queries slim cards through slimListingForCard", () => {
    const queries = read("services/listings/listing-queries.ts");
    const featured = read("services/listings/listings.service.ts");
    assert.match(queries, /slimListingForCard/);
    assert.match(featured, /slim:\s*"card"/);
  });
});
