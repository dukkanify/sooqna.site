/**
 * Vehicle catalog integrity + Make→Model cascade guards.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
