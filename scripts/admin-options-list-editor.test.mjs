/**
 * Admin options list editor — no technical label:value CSV in UI.
 * Run: node --test scripts/admin-options-list-editor.test.mjs
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

describe("admin options list editor", () => {
  it("ships AdminOptionsListEditor with add/delete/reorder affordances", () => {
    const editor = read("features/admin/components/AdminOptionsListEditor.tsx");
    assert.match(editor, /export function AdminOptionsListEditor/);
    assert.match(editor, /إضافة خيار جديد/);
    assert.match(editor, /اسم الخيار/);
    assert.match(editor, /القيمة/);
    assert.match(editor, /draggable/);
    assert.match(editor, /onDragStart/);
    assert.match(editor, /removeRow|حذف/);
    assert.match(editor, /mode\?:\s*"pair"\s*\|\s*"label-only"/);
  });

  it("category forms use the editor instead of label:value CSV", () => {
    const forms = read("features/admin/components/AdminCategoryFormsPanel.tsx");
    assert.match(forms, /AdminOptionsListEditor/);
    assert.match(forms, /خيارات القائمة/);
    assert.doesNotMatch(forms, /label:value/);
    assert.doesNotMatch(forms, /مفصولة بفاصلة/);
    assert.doesNotMatch(forms, /غرف نوم:غرف نوم/);
    assert.match(forms, /OPTION_FIELD_TYPES/);
    assert.match(forms, /cleanedOptions/);
  });

  it("categories create/edit use list editor instead of comma textarea", () => {
    const cats = read("features/admin/components/AdminCategoriesPanel.tsx");
    assert.match(cats, /AdminOptionsListEditor/);
    assert.match(cats, /mode="label-only"/);
    assert.doesNotMatch(cats, /createSubsText/);
    assert.doesNotMatch(cats, /سطر أو فاصلة لكل تصنيف/);
    assert.doesNotMatch(cats, /المعرّف \(slug\)/);
    assert.match(cats, /معرّف الرابط/);
  });

  it("EN phrases cover new option-editor labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["خيارات القائمة"], "List options");
    assert.equal(phrases["اسم الخيار"], "Option name");
    assert.equal(phrases["إضافة خيار جديد"], "Add new option");
    assert.equal(phrases["معرّف الحقل"], "Field ID");
    assert.ok(!phrases["خيارات القائمة (label:value مفصولة بفاصلة)"]);
  });
});
