/**
 * Admin categories desk uses homepage CategoryMark 3D icons (not cropped line icons).
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

describe("admin category home icons", () => {
  it("AdminCategoriesPanel renders CategoryMark compact tiles", () => {
    const panel = read("features/admin/components/AdminCategoriesPanel.tsx");
    assert.match(panel, /CategoryMark/);
    assert.match(panel, /compact/);
    assert.match(panel, /admin-category-mark/);
    assert.doesNotMatch(panel, /from \"@\/shared\/ui\/CategoryIcon\"/);
    assert.match(panel, /from \"@\/shared\/components\/CategoryMark\"/);
  });

  it("CategoryMark compact mode uses contain fit (no crop)", () => {
    const mark = read("shared/components/CategoryMark.tsx");
    const css = read("app/globals.css");
    assert.match(mark, /compact\?:/);
    assert.match(mark, /category-mark--compact/);
    assert.match(css, /\.category-mark--compact/);
    assert.match(css, /object-fit:\s*contain/);
  });

  it("uses the same 3D asset map as the homepage", () => {
    const icons = read("shared/constants/category-3d-icons.ts");
    const mark = read("shared/components/CategoryMark.tsx");
    assert.match(icons, /\/brand\/categories\/car\.webp/);
    assert.match(mark, /getCategory3dIconSrc/);
  });
});
