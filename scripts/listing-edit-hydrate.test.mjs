/**
 * Seller/admin listing edit must hydrate specs + images from the catalog.
 * Run: node --test scripts/listing-edit-hydrate.test.mjs
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

describe("listing edit hydrates specs and images", () => {
  it("hydrateCategorySpecsForEdit fills emirate/city and nested car aliases", () => {
    const src = read("shared/listings/listing-form-hydrate.ts");
    assert.match(src, /export function hydrateCategorySpecsForEdit/);
    assert.match(src, /listingEmirate/);
    assert.match(src, /listingArea/);
    assert.match(src, /fuelType/);
    assert.match(src, /carSpecs/);
    assert.match(src, /export function mergeCategorySpecs/);
  });

  it("seller edit defaults go through hydration and merge on save", () => {
    const defaults = read("features/listings/components/listing-edit.utils.ts");
    const hook = read("features/listings/components/useEditListingForm.ts");
    assert.match(defaults, /hydrateCategorySpecsForEdit\(listing\)/);
    assert.match(hook, /mergeCategorySpecs/);
    assert.match(hook, /MAX_LISTING_IMAGES/);
  });

  it("create/edit forms persist emirate and city inside categorySpecs", () => {
    const src = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    assert.match(src, /categorySpecs\.city = value/);
    assert.match(src, /categorySpecs\.emirate = value/);
  });

  it("admin edit loads the full listing before showing the form", () => {
    const route = read("app/api/admin/listings/[id]/route.ts");
    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    const store = read("services/listings/listing-store.ts");
    assert.match(route, /export async function GET/);
    assert.match(route, /toAdminListingRecord/);
    assert.match(panel, /\/api\/admin\/listings\/\$\{requestId\}/);
    assert.match(panel, /جاري تحميل المواصفات والصور/);
    assert.match(store, /hydrateCategorySpecsForEdit\(media\)/);
  });

  it("image cap is 12 across add, edit, and admin gallery", () => {
    const media = read("shared/constants/listing-media.ts");
    const persist = read("shared/utils/persist-images.ts");
    const gallery = read("features/admin/components/AdminListingImageGallery.tsx");
    const seller = read("features/listings/components/ListingMediaSection.tsx");
    const api = read("app/api/listings/[id]/route.ts");
    assert.match(media, /MAX_LISTING_IMAGES = 12/);
    assert.match(persist, /MAX_LISTING_IMAGES/);
    assert.match(gallery, /MAX_LISTING_IMAGES/);
    assert.match(seller, /totalImages\}\/\{MAX_LISTING_IMAGES\}/);
    assert.match(api, /max\(MAX_LISTING_IMAGES\)/);
  });

  it("category fields keep stored select values that are not in the option list", () => {
    const src = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(src, /function optionsWithStoredValue/);
    assert.match(src, /specsFromDefaults/);
  });
});
