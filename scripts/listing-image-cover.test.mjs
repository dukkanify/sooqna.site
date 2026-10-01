import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  LISTING_COVER_HEIGHT,
  LISTING_COVER_WIDTH,
  coverCropRect,
} from "../shared/utils/listing-image-cover.ts";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("listing image uniform cover size", () => {
  it("center-crops any aspect into a 3:2 cover window", () => {
    assert.equal(LISTING_COVER_WIDTH, 960);
    assert.equal(LISTING_COVER_HEIGHT, 640);

    const landscape = coverCropRect(1200, 600);
    assert.ok(Math.abs(landscape.sw / landscape.sh - 1.5) < 0.001);
    assert.equal(landscape.sy, 0);
    assert.ok(landscape.sx > 0);

    const portrait = coverCropRect(600, 1200);
    assert.ok(Math.abs(portrait.sw / portrait.sh - 1.5) < 0.001);
    assert.equal(portrait.sx, 0);
    assert.ok(portrait.sy > 0);

    const exact = coverCropRect(900, 600);
    assert.equal(exact.sx, 0);
    assert.equal(exact.sy, 0);
    assert.equal(exact.sw, 900);
    assert.equal(exact.sh, 600);
  });

  it("cards, previews, and upload path share the 3:2 cover contract", () => {
    const css = read("app/globals.css");
    const card = read("features/listings/components/PremiumListingCard.tsx");
    const preview = read(
      "features/listings/components/add-listing/ListingPreviewPanel.tsx",
    );
    const media = read(
      "features/listings/components/add-listing/MediaContactStep.tsx",
    );
    const upload = read("services/upload/upload.service.ts");
    const persist = read("shared/utils/persist-images.ts");

    assert.match(css, /aspect-ratio:\s*3\s*\/\s*2/);
    assert.match(
      css,
      /\.marketplace-card-image[\s\S]*object-fit:\s*cover\s*!important/,
    );
    assert.match(card, /marketplace-card-media/);
    assert.match(card, /aspect-\[3\/2\]/);
    assert.doesNotMatch(card, /h-full min-h-full/);
    assert.match(preview, /aspect-\[3\/2\]/);
    assert.match(media, /aspect-\[3\/2\]/);
    assert.match(upload, /normalizeListingImageFiles/);
    assert.match(persist, /coverCropRect/);
    assert.match(persist, /LISTING_COVER_WIDTH/);
  });
});
