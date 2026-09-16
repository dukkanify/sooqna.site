/**
 * Vehicle catalog integrity + Make→Model cascade guards.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  readFileSync(path.join(root, "shared/vehicles/catalog.json"), "utf8"),
);

test("vehicle catalog has comprehensive makes and models", () => {
  assert.ok(catalog.makes.length >= 80, `makes=${catalog.makes.length}`);
  assert.ok(catalog.models.length >= 400, `models=${catalog.models.length}`);
});

test("every model points at a valid make", () => {
  const makeIds = new Set(catalog.makes.map((m) => m.id));
  for (const model of catalog.models) {
    assert.ok(makeIds.has(model.makeId), model.id);
  }
});

test("make and model slugs are unique within scope", () => {
  const makeSlugs = catalog.makes.map((m) => m.slug);
  assert.equal(makeSlugs.length, new Set(makeSlugs).size);
  const modelKeys = catalog.models.map((m) => `${m.makeId}::${m.slug}`);
  assert.equal(modelKeys.length, new Set(modelKeys).size);
});

test("Mercedes-Benz / Toyota / BMW / Nissan / BYD have models", () => {
  const byName = Object.fromEntries(
    catalog.makes.map((m) => [m.nameEn, m]),
  );
  for (const name of ["Mercedes-Benz", "Toyota", "BMW", "Nissan", "BYD"]) {
    assert.ok(byName[name], name);
    const models = catalog.models.filter((m) => m.makeId === byName[name].id);
    assert.ok(models.length >= 3, `${name} models=${models.length}`);
  }
});

test("create-listing form cascades brand→model", () => {
  const src = readFileSync(
    path.join(
      root,
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    ),
    "utf8",
  );
  assert.match(src, /getModelsForBrand/);
  assert.match(src, /key === "brand"/);
  assert.match(src, /next\.model = ""/);
  assert.match(src, /model-\$\{categoryId\}-\$\{specs\.brand/);
});

test("search filters cascade brand→model", () => {
  const src = readFileSync(
    path.join(root, "features/search/lib/category-filter-fields.ts"),
    "utf8",
  );
  assert.match(src, /getModelsForBrand/);
  assert.match(src, /brand:\s*"model"|CASCADE_CHILD/);
});

test("product-brands car list is catalog-backed", () => {
  const src = readFileSync(
    path.join(root, "shared/constants/product-brands.ts"),
    "utf8",
  );
  assert.match(src, /getVehicleMakes/);
  assert.doesNotMatch(src, /"Hummer",\s*\n\] as const/);
});

test("live EV fuel type uses canonical كهربائي", () => {
  const src = readFileSync(
    path.join(root, "services/listings/live-marketplace-catalog.ts"),
    "utf8",
  );
  assert.match(src, /fuelType = .*كهربائي/);
  assert.doesNotMatch(src, /fuelType = .*\"كهرباء\"/);
});

test("every make has country of origin", () => {
  for (const make of catalog.makes) {
    assert.ok(make.countryCode, `${make.nameEn} missing countryCode`);
    assert.ok(make.countryNameEn, `${make.nameEn} missing countryNameEn`);
    assert.ok(make.countryNameAr, `${make.nameEn} missing countryNameAr`);
  }
});

test("BYD includes Song model", () => {
  const byd = catalog.makes.find((m) => m.slug === "byd");
  assert.ok(byd);
  const song = catalog.models.find(
    (m) => m.makeId === byd.id && m.slug === "song",
  );
  assert.ok(song, "BYD Song model missing");
});

test("listing media has BYD-specific pool hint", () => {
  const src = readFileSync(
    path.join(root, "shared/constants/listing-product-media.ts"),
    "utf8",
  );
  assert.match(src, /byd_suv/);
  assert.match(src, /byd\|بي/);
  assert.match(src, /\/media\/vehicles\/byd\/byd-song-plus-ev-champion-edition-001\.jpg/);
  // Former Unsplash pool included a Tesla Roadster — must not return.
  assert.doesNotMatch(src, /photo-1617788138017-80ad40651399/);
  assert.doesNotMatch(src, /photo-1619767886558-efdc259cde1a/);
});

test("BYD Song showcase media files exist on disk", () => {
  for (const name of [
    "byd-song-plus-ev-champion-edition-001.jpg",
    "byd-song-plus-ev-champion-edition-002.jpg",
    "byd-song-plus-ev-champion-edition-003.jpg",
  ]) {
    assert.ok(
      existsSync(path.join(root, "public/media/vehicles/byd", name)),
      name,
    );
  }
});
