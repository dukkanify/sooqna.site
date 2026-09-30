/**
 * Admin locations: easy create + inline edit.
 * Run: npm test
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

describe("admin locations easy edit", () => {
  it("panel supports create form submit and per-card edit mode", () => {
    const src = read("features/admin/components/AdminLocationsPanel.tsx");
    assert.match(src, /onSubmit=\{handleCreate\}/);
    assert.match(src, /startEdit/);
    assert.match(src, /saveEdit/);
    assert.match(src, /حفظ التعديل/);
    assert.match(src, /بحث سريع/);
    assert.match(src, /admin-locations__create-grid/);
    assert.doesNotMatch(src, /getSessionUser/);
  });

  it("PATCH API already accepts name and emirate", () => {
    const types = read("types/domain/location.ts");
    const route = read("app/api/admin/locations/[id]/route.ts");
    assert.match(types, /"name" \| "emirate" \| "enabled" \| "sortOrder"/);
    assert.match(route, /body\.name/);
  });

  it("EN phrases cover edit labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["حفظ التعديل"], "Save changes");
    assert.equal(phrases["بحث سريع"], "Quick search");
    assert.equal(phrases["تعديل الموقع"], "Edit location");
  });
});
