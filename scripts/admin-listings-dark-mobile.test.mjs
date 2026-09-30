/**
 * Admin listings desk: dark-mode contrast + mobile cards + create without localStorage gate.
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

describe("admin listings dark mode + mobile", () => {
  it("admin-ops CSS themes listings table for dark mode", () => {
    const css = read("features/admin/components/admin-ops.css");
    assert.match(css, /html\[data-theme="dark"\] \.admin-ops/);
    assert.match(css, /--admin-surface: #121a2a/);
    assert.match(css, /\.admin-listings-table \.text-ink/);
    assert.match(css, /color: var\(--admin-ink\) !important/);
    assert.match(css, /\.admin-listings-mobile-list/);
    assert.match(css, /@media \(max-width: 768px\)/);
  });

  it("create/load no longer silently gated on getSessionUser", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    assert.doesNotMatch(src, /getSessionUser/);
    assert.match(src, /انتهت صلاحية الجلسة/);
    assert.match(src, /openToolsPanel/);
    assert.match(src, /admin-listings-tools/);
    assert.match(src, /admin-listings-mobile-list/);
    assert.match(src, /variant="primary"/);
  });

  it("EN phrases cover session recovery copy", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(
      phrases["انتهت صلاحية الجلسة. حدّث الصفحة وسجّل الدخول مجدداً."],
      "Session expired. Refresh the page and sign in again.",
    );
  });
});
