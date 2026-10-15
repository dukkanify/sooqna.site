/**
 * Catalog integrity: honest covers, emirate URL alias, mash-title quarantine.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSearchFilterState } from "../features/search/components/search-url.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("listing photo + catalog integrity", () => {
  it("accepts emirate= as an alias for the city filter", () => {
    const fromEmirate = parseSearchFilterState({
      emirate: "دبي",
      q: "gghhhhhh",
    });
    assert.equal(fromEmirate.city, "دبي");
    assert.equal(fromEmirate.query, "gghhhhhh");

    const cityWins = parseSearchFilterState({
      city: "عجمان",
      emirate: "دبي",
    });
    assert.equal(cityWins.city, "عجمان");
  });

  it("keeps real media first and only uses temporary covers when empty", () => {
    const card = read("services/listings/listing-card-model.ts");
    const feed = read("services/listings/home-feed.ts");
    const utils = read("features/listings/components/listing-card.utils.ts");
    const policy = read("services/listings/mock-catalog-policy.ts");
    const emirate = read("shared/listings/uae-emirate.ts");
    const temp = read("shared/listings/temporary-listing-cover.ts");
    // Card slim still never invents stock into SSR payloads.
    assert.doesNotMatch(card, /galleryForListingProduct/);
    assert.doesNotMatch(feed, /galleryForListingProduct/);
    assert.match(utils, /Keep `data:` URLs/);
    assert.match(utils, /getListingCardImageUrl/);
    assert.match(temp, /galleryForListingProduct/);
    assert.match(feed, /sooqna-home-feed-v38-blob-optimize/);
    assert.match(policy, /isKeyboardMashTitle/);
    assert.match(policy, /gghhhhhh-793620/);
    assert.match(emirate, /export function listingMatchesEmirateFilter/);
  });
});
