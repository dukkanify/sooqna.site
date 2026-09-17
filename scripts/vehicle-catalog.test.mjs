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
  assert.ok(catalog.makes.length >= 130, `makes=${catalog.makes.length}`);
  assert.ok(catalog.models.length >= 750, `models=${catalog.models.length}`);
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

test("brand combobox lists all makes without a 12-item cap", () => {
  const src = readFileSync(
    path.join(root, "shared/ui/BrandCombobox.tsx"),
    "utf8",
  );
  assert.match(src, /ماركة — مرّر أو اكتب للبحث|موديل — مرّر أو اكتب للبحث/);
  assert.match(src, /filterModelOptions|filterBrandOptions/);
  assert.match(src, /filtered\.map/);
  assert.doesNotMatch(src, /filtered\.slice\(0,\s*12\)/);
  const opts = readFileSync(
    path.join(root, "shared/vehicles/index.ts"),
    "utf8",
  );
  assert.match(opts, /vehicleMakeOptions/);
  assert.match(opts, /nameAr/);
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

test("UAE core makes are present", () => {
  const names = new Set(catalog.makes.map((m) => m.nameEn));
  for (const name of [
    "Toyota",
    "Nissan",
    "Mercedes-Benz",
    "BMW",
    "BYD",
    "Hyundai",
    "Kia",
    "Lexus",
    "Land Rover",
    "Tesla",
    "Lucid",
    "Geely",
    "Chery",
    "Haval",
    "MG",
    "Xiaomi",
    "Avatr",
    "Denza",
    "BRABUS",
    "YangWang",
    "INEOS",
    "KGM",
    "GWM",
  ]) {
    assert.ok(names.has(name), name);
  }
});

test("duplicate marque names are normalized via aliases not separate makes", () => {
  const names = new Set(catalog.makes.map((m) => m.nameEn));
  assert.equal(names.has("Range Rover"), false);
  assert.equal(names.has("SsangYong"), false);
  assert.equal(names.has("Great Wall"), false);
  assert.equal(names.has("Mercedes-Maybach"), false);
  const landRover = catalog.makes.find((m) => m.nameEn === "Land Rover");
  assert.ok(landRover?.aliases?.some((a) => /range rover/i.test(a)));
  assert.ok(
    catalog.models.some(
      (m) => m.makeId === landRover.id && m.slug === "range-rover",
    ),
  );
  const kgm = catalog.makes.find((m) => m.nameEn === "KGM");
  assert.ok(kgm?.aliases?.some((a) => /ssangyong/i.test(a)));
  const gwm = catalog.makes.find((m) => m.nameEn === "GWM");
  assert.ok(gwm?.aliases?.some((a) => /great wall/i.test(a)));
  const mb = catalog.makes.find((m) => m.nameEn === "Mercedes-Benz");
  assert.ok(mb?.aliases?.some((a) => /maybach/i.test(a)));
  const aliases = readFileSync(
    path.join(root, "shared/vehicles/aliases.ts"),
    "utf8",
  );
  assert.match(aliases, /"range rover": "Land Rover"/);
  assert.match(aliases, /ssangyong: "KGM"/);
  assert.match(aliases, /"great wall": "GWM"/);
});

test("popular UAE makes sort ahead of long-tail alphabetics", () => {
  const head = catalog.makes.slice(0, 8).map((m) => m.nameEn);
  assert.deepEqual(head.slice(0, 4), [
    "Toyota",
    "Nissan",
    "Mercedes-Benz",
    "BMW",
  ]);
  for (const make of catalog.makes) {
    assert.ok(Array.isArray(make.aliases) && make.aliases.length > 0, make.nameEn);
  }
});

test("UAE-relevant current/used models covered", () => {
  const bySlug = Object.fromEntries(catalog.makes.map((m) => [m.slug, m]));
  function has(makeSlug, modelSlug) {
    const make = bySlug[makeSlug];
    assert.ok(make, makeSlug);
    const hit = catalog.models.find(
      (m) => m.makeId === make.id && m.slug === modelSlug,
    );
    assert.ok(hit, `${makeSlug}/${modelSlug}`);
  }
  has("toyota", "raize");
  has("toyota", "urban-cruiser");
  has("toyota", "land-cruiser");
  has("nissan", "patrol");
  has("nissan", "z");
  has("mercedes-benz", "g-class");
  has("bmw", "x5");
  has("byd", "qin");
  has("byd", "atto-3");
});

test("year options are dynamic 1990→current+1 from shared helper", () => {
  const yearSrc = readFileSync(
    path.join(root, "shared/vehicles/year-options.ts"),
    "utf8",
  );
  assert.match(yearSrc, /VEHICLE_YEAR_MIN = 1990/);
  assert.match(yearSrc, /getFullYear\(\) \+ 1/);
  const fields = readFileSync(
    path.join(root, "shared/constants/category-fields.ts"),
    "utf8",
  );
  assert.match(fields, /vehicleYearOptions/);
  assert.doesNotMatch(fields, /currentYear - 1989/);
  const filters = readFileSync(
    path.join(root, "features/search/lib/category-filter-fields.ts"),
    "utf8",
  );
  assert.match(filters, /vehicleYearOptions/);
  assert.match(filters, /regionalSpecs/);
});

test("regional specs include GCC/Canadian/Korean and modelOther suggestion", () => {
  const yearSrc = readFileSync(
    path.join(root, "shared/vehicles/year-options.ts"),
    "utf8",
  );
  assert.match(yearSrc, /خليجي/);
  assert.match(yearSrc, /كندي/);
  assert.match(yearSrc, /كوري/);
  const fields = readFileSync(
    path.join(root, "shared/constants/category-fields.ts"),
    "utf8",
  );
  assert.match(fields, /REGIONAL_SPEC_OPTIONS/);
  assert.match(fields, /modelOther/);
  assert.match(fields, /اقتراح موديل/);
  const form = readFileSync(
    path.join(
      root,
      "features/listings/components/add-listing/useAddListingForm.ts",
    ),
    "utf8",
  );
  assert.match(form, /fieldKey: "model"/);
  assert.match(form, /modelOther/);
});

test("admin can add models and approve car model suggestions into catalog", () => {
  const store = readFileSync(
    path.join(root, "services/admin/vehicle-catalog-overrides-store.ts"),
    "utf8",
  );
  assert.match(store, /addedModels/);
  assert.match(store, /parseMakeModelSuggestion/);
  const api = readFileSync(
    path.join(root, "app/api/admin/vehicle-catalog/route.ts"),
    "utf8",
  );
  assert.match(api, /addModel/);
  const review = readFileSync(
    path.join(root, "services/admin/option-suggestion-store.ts"),
    "utf8",
  );
  assert.match(review, /categoryId === "cars"/);
  assert.match(review, /fieldKey === "model"/);
  assert.match(review, /saveVehicleCatalogOverrides/);
  const panel = readFileSync(
    path.join(root, "features/admin/components/AdminVehicleCatalogPanel.tsx"),
    "utf8",
  );
  assert.match(panel, /اقتراحات موديلات/);
  assert.match(panel, /addModel/);
  const runtime = readFileSync(
    path.join(root, "shared/vehicles/index.ts"),
    "utf8",
  );
  assert.match(runtime, /fromOverrides/);
  assert.match(runtime, /addedModels/);
});
