/**
 * Prevention guards: mash titles blocked, durable covers required to activate,
 * inline data: photos materialize when cloud storage is available.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  isKeyboardMashTitle,
} from "../services/listings/mock-catalog-policy.ts";
import {
  isInlineListingMediaUrl,
  isRemoteDurableListingMediaUrl,
  listingHasRemoteDurableCover,
} from "../shared/listings/durable-media.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("listing publish guards prevent photo/title regression", () => {
  it("detects inline vs remote durable media", () => {
    assert.equal(isInlineListingMediaUrl("data:image/jpeg;base64,abc"), true);
    assert.equal(isInlineListingMediaUrl("https://blob.vercel-storage.com/x.jpg"), false);
    assert.equal(
      isRemoteDurableListingMediaUrl("https://blob.vercel-storage.com/x.jpg"),
      true,
    );
    assert.equal(
      isRemoteDurableListingMediaUrl("data:image/jpeg;base64,abc"),
      false,
    );
    assert.equal(
      isRemoteDurableListingMediaUrl("/api/media/listings/x.jpg"),
      false,
    );
    assert.equal(
      listingHasRemoteDurableCover({
        images: ["data:image/jpeg;base64,abc"],
      }),
      false,
    );
    assert.equal(
      listingHasRemoteDurableCover({
        imageUrl: "https://example.com/car.jpg",
      }),
      true,
    );
  });

  it("wires mash + durable cover guards into store and APIs", () => {
    const guards = read("services/listings/listing-publish-guards.ts");
    const store = read("services/listings/listing-store.ts");
    const sellerApi = read("app/api/listings/route.ts");
    const adminApi = read("app/api/admin/listings/[id]/route.ts");
    const upload = read("services/upload/upload.service.ts");
    const form = read("features/listings/components/add-listing/useAddListingForm.ts");

    assert.match(guards, /LISTING_TITLE_INVALID/);
    assert.match(guards, /LISTING_IMAGES_REQUIRED/);
    assert.match(guards, /materializeInlineListingImages/);
    assert.match(guards, /assertListingReadyForPublicActivation/);
    assert.match(store, /prepareListingForPersistence/);
    assert.match(sellerApi, /LISTING_TITLE_INVALID/);
    assert.match(adminApi, /LISTING_IMAGES_REQUIRED/);
    assert.match(upload, /لا يمكن حفظ صور مؤقتة على الإنتاج/);
    assert.match(form, /isKeyboardMashTitle/);
    assert.equal(isKeyboardMashTitle("Gghhhhhh"), true);
  });
});
