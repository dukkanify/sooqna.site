/**
 * Admin desk contrast — toggles and surfaces must stay readable in dark mode.
 * Run: npm test
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

describe("admin dark-mode contrast", () => {
  const css = read("features/admin/components/admin-ops.css");
  const settings = read("features/admin/components/AdminSettingsPanel.tsx");

  it("settings toggles use the themeable admin-ops__toggle class", () => {
    assert.match(settings, /admin-ops__toggle/);
    assert.match(settings, /وضع الصيانة/);
    assert.match(settings, /السماح بالشراء كضيف/);
    assert.match(settings, /اعتماد الحساب تلقائياً/);
  });

  it("toggle surface uses CSS tokens, not hardcoded white", () => {
    const toggleBlock = css.match(
      /\.admin-ops__toggle\s*\{[\s\S]*?\n\}/,
    )?.[0];
    assert.ok(toggleBlock, "toggle rule exists");
    assert.match(toggleBlock, /background:\s*var\(--admin-elevated\)/);
    assert.match(toggleBlock, /color:\s*var\(--admin-ink\)/);
    assert.doesNotMatch(toggleBlock, /background:\s*#fff\b/);
  });

  it("dark theme remaps elevated/toggle surfaces and keeps inverse chips dark", () => {
    assert.match(
      css,
      /html\[data-theme="dark"\]\s*\.admin-ops\s*\{[\s\S]*--admin-elevated:\s*#182234/,
    );
    assert.match(
      css,
      /html\[data-theme="dark"\]\s*\.admin-ops\s*\{[\s\S]*--admin-inverse:\s*#0b1628/,
    );
    assert.match(css, /html\[data-theme="dark"\]\s*\.admin-ops__toggle\s*\{/);
    assert.match(
      css,
      /html\[data-theme="dark"\]\s*\.admin-ops__toggle\s+span\s*\{[\s\S]*color:\s*var\(--admin-ink\)/,
    );
  });

  it("design tokens keep dark ink lighter than dark surfaces", () => {
    const tokens = read("styles/design-tokens.css");
    const dark = tokens.match(
      /html\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    assert.ok(dark, "dark token block exists");
    assert.match(dark, /--color-ink:\s*#eef2f8/);
    assert.match(dark, /--color-surface:\s*#121a2a/);
    assert.match(dark, /--color-muted:\s*#c5cddc/);
  });
});
