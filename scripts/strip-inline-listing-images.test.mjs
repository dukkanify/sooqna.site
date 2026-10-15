/**
 * Card payloads must never embed data:/blob: images (SSR HTML size).
 * Temporary category covers are applied in UI/repair — not inside slimListingForCard.
 * Detail/edit keep real seller `data:` media via getListingImages.
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
  it("slimListingForCard rejects data/blob covers and does not invent stock itself", () => {
    const src = read("services/listings/listing-card-model.ts");
    assert.match(src, /export function isInlineListingImageUrl/);
    assert.match(src, /startsWith\("data:"\)/);
    assert.match(src, /startsWith\("blob:"\)/);
    assert.doesNotMatch(src, /galleryForListingProduct/);
    assert.match(src, /never invent Unsplash/);
  });

  it("home feed cover candidates skip inline data URLs (temps come from repair)", () => {
    const feed = read("services/listings/home-feed.ts");
    assert.match(feed, /startsWith\("data:"\)/);
    assert.match(feed, /startsWith\("blob:"\)/);
    assert.doesNotMatch(feed, /galleryForListingProduct/);
    assert.match(feed, /sooqna-home-feed-v37-temp-covers/);
  });

  it("getListingImages keeps seller data: URLs and only omits blob:", () => {
    const src = read("features/listings/components/listing-card.utils.ts");
    assert.match(src, /startsWith\("blob:"\)/);
    assert.match(src, /Keep `data:` URLs/);
    // Must not filter out data: the way cards do — detail needs real photos.
    assert.doesNotMatch(
      src,
      /!url\.toLowerCase\(\)\.startsWith\("data:"\)/,
    );
  });

  it("public listing queries slim cards through slimListingForCard", () => {
    const queries = read("services/listings/listing-queries.ts");
    const featured = read("services/listings/listings.service.ts");
    assert.match(queries, /slimListingForCard/);
    assert.match(featured, /slim:\s*"card"/);
  });
});
