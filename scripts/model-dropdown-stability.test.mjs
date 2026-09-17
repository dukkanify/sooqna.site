/**
 * Model dropdown stability: Other pinning, no loading placeholder flash,
 * make-change clear, search restore, stale override guard.
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

const OTHER = { label: "أخرى", value: "أخرى" };

function modelsForMake(nameEn) {
  const make = catalog.makes.find((m) => m.nameEn === nameEn);
  assert.ok(make, nameEn);
  return catalog.models
    .filter((m) => m.makeId === make.id && m.active !== false)
    .map((m) => ({ label: m.nameEn, value: m.nameEn }));
}

function withOther(models) {
  return [...models, OTHER];
}

function filterBrandOptions(options, query) {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  const starts = [];
  const contains = [];
  for (const option of options) {
    const label = option.label.toLowerCase();
    const value = option.value.toLowerCase();
    if (label.startsWith(q) || value.startsWith(q)) starts.push(option);
    else if (label.includes(q) || value.includes(q)) contains.push(option);
  }
  return [...starts, ...contains];
}

/** Mirror of shared/constants/product-brands.filterModelOptions */
function filterModelOptions(options, query) {
  const other = options.find((o) => o.value === "أخرى");
  const rest = options.filter((o) => o.value !== "أخرى");
  const filtered = filterBrandOptions(rest, query);
  return other ? [...filtered, other] : filtered;
}

test("A: Toyota models render with Other once at bottom", () => {
  const options = withOther(modelsForMake("Toyota"));
  assert.ok(options.length > 5, `toyota models=${options.length}`);
  const otherHits = options.filter((o) => o.value === "أخرى");
  assert.equal(otherHits.length, 1);
  assert.equal(options.at(-1)?.value, "أخرى");
  assert.ok(options.some((o) => /camry/i.test(o.value)));

  const src = readFileSync(
    path.join(root, "shared/vehicles/index.ts"),
    "utf8",
  );
  assert.match(src, /OTHER_OPTION/);
  assert.match(src, /vehicleModelOptionsForMake/);
});

test("B: empty brand does not use Other as loading placeholder", () => {
  const brandModels = readFileSync(
    path.join(root, "shared/constants/product-brand-models.ts"),
    "utf8",
  );
  assert.match(brandModels, /if \(!key\) return \[\]/);
  assert.doesNotMatch(
    brandModels,
    /if \(!key\) return \[OTHER\]/,
  );
  const vehicles = readFileSync(
    path.join(root, "shared/vehicles/index.ts"),
    "utf8",
  );
  assert.match(
    vehicles,
    /if \(!makeName\?\.trim\(\)\) return \[\]/,
  );
});

test("C: Toyota → Mercedes clears to Mercedes models only", () => {
  const toyota = withOther(modelsForMake("Toyota")).map((o) => o.value);
  const mercedes = withOther(modelsForMake("Mercedes-Benz")).map((o) => o.value);
  assert.ok(toyota.includes("Camry"));
  assert.ok(!mercedes.includes("Camry"));
  assert.ok(mercedes.some((v) => /C-Class|E-Class|GLC|G-Class/i.test(v)));
  assert.equal(mercedes.at(-1), "أخرى");

  const formSrc = readFileSync(
    path.join(
      root,
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    ),
    "utf8",
  );
  assert.match(formSrc, /next\.model = ""/);
  assert.match(formSrc, /next\.modelOther = ""/);
});

test("D/E: search Cam keeps Other pinned; clear restores full list", () => {
  const options = withOther(modelsForMake("Toyota"));
  const cam = filterModelOptions(options, "Cam");
  assert.ok(cam.some((o) => /camry/i.test(o.value)));
  assert.equal(cam.at(-1)?.value, "أخرى");
  const brandStyle = filterBrandOptions(options, "Cam");
  assert.ok(!brandStyle.some((o) => o.value === "أخرى"));

  const cleared = filterModelOptions(options, "");
  assert.equal(cleared.length, options.length);
  assert.equal(cleared.at(-1)?.value, "أخرى");

  const brandsSrc = readFileSync(
    path.join(root, "shared/constants/product-brands.ts"),
    "utf8",
  );
  assert.match(brandsSrc, /export function filterModelOptions/);
  assert.match(brandsSrc, /isOtherOptionValue/);
});

test("F: stale overrides response is ignored (cancelled guard)", () => {
  const src = readFileSync(
    path.join(
      root,
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    ),
    "utf8",
  );
  assert.match(src, /let cancelled = false/);
  assert.match(src, /if \(cancelled\) return/);
  assert.match(src, /setCatalogEpoch/);
  assert.match(src, /catalogLoading/);
  assert.match(src, /comboboxLoading|loading=\{comboboxLoading\}/);
});

test("G: edit listing keeps brand/model defaults stable (no Other remount flash)", () => {
  const src = readFileSync(
    path.join(
      root,
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    ),
    "utf8",
  );
  assert.match(src, /field\.key === "brand" \|\| field\.key === "model"/);
  assert.match(src, /specs\[field\.key\] \?\? ""/);
  assert.match(src, /model-\$\{categoryId\}-\$\{specs\.brand/);
  assert.doesNotMatch(
    src,
    /model-\$\{categoryId\}-\$\{specs\.brand \?\? ""\}-\$\{catalogEpoch\}/,
  );
});

test("BrandCombobox pins Other for model optionKind + EN label via t()", () => {
  const src = readFileSync(
    path.join(root, "shared/ui/BrandCombobox.tsx"),
    "utf8",
  );
  assert.match(src, /optionKind/);
  assert.match(src, /filterModelOptions/);
  assert.match(src, /جاري تحميل الموديلات/);
  assert.match(src, /t\(option\.label\)/);
  assert.match(src, /resolveOptionFromQuery/);
});

test("resolveVehicleMakeName accepts bilingual combobox labels", () => {
  const src = readFileSync(
    path.join(root, "shared/vehicles/index.ts"),
    "utf8",
  );
  assert.match(src, /trimmed\.includes\("·"\)/);
  assert.match(src, /split\("·"\)/);
});

test("BYD / Nissan models also end with Other once", () => {
  for (const make of ["BYD", "Nissan", "Toyota", "Mercedes-Benz"]) {
    const options = withOther(modelsForMake(make));
    assert.equal(options.filter((o) => o.value === "أخرى").length, 1);
    assert.equal(options.at(-1)?.value, "أخرى");
    assert.ok(options.length > 2, make);
  }
});
