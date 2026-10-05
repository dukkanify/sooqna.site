/**
 * Admin Edit must load the full listing before save — never overwrite with slim desk rows.
 * Run: node --test --experimental-strip-types scripts/admin-edit-full-hydrate.test.mjs
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

describe("admin edit full hydrate", () => {
  it("admin GET uses getListingById with live-catalog parity", () => {
    const store = read("services/listings/listing-store.ts");
    assert.match(store, /syncLiveCatalogMedia/);
    assert.match(store, /export async function getListingById/);
    assert.match(store, /withCatalogParity/);
    assert.match(store, /videoUrl: listing\.videoUrl/);
  });

  it("live catalog enrich fills empty description/media without overwriting", () => {
    const src = read("services/listings/live-marketplace-catalog.ts");
    assert.match(src, /fillDescription/);
    assert.match(src, /isBlankText\(listing\.description\)/);
    assert.match(src, /fillSpecs/);
    assert.match(src, /mediaStale/);
  });

  it("admin panel blocks save until detail GET succeeds", () => {
    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /editHydrated/);
    assert.match(panel, /تعذر تحميل بيانات الإعلان الكاملة/);
    assert.match(panel, /!editHydrated/);
    assert.match(panel, /disabled=\{editLoading \|\| !editHydrated\}/);
    assert.match(panel, /لن يُعرض نموذج التعديل حتى تُحمَّل بيانات الإعلان الكاملة/);
  });

  it("patch merges categorySpecs and refuses blanking description", () => {
    const store = read("services/listings/listing-store.ts");
    assert.match(store, /mergeCategorySpecs\(/);
    assert.match(store, /Never blank a non-empty description/);
    assert.match(store, /previous\.videoUrl/);
    const hydrate = read("shared/listings/listing-form-hydrate.ts");
    assert.match(hydrate, /export function mergeCategorySpecs/);
    assert.match(hydrate, /if \(typeof value === "string" && value\.trim\(\) === ""\) continue/);
  });

  it("hydrateCategorySpecsForEdit maps nested electronicsSpecs", () => {
    const hydrate = read("shared/listings/listing-form-hydrate.ts");
    assert.match(hydrate, /electronicsSpecs/);
    assert.match(hydrate, /carSpecs/);
    assert.match(hydrate, /realEstateSpecs/);
  });

  it("images are only patched when the admin gallery was touched", () => {
    const panel = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(panel, /editImagesTouched/);
    assert.match(panel, /\.\.\.\(editImagesTouched/);
  });
});
