/**
 * Admin desk contrast — toggles, KPI tones, and tinted sections must stay
 * readable in dark mode (no light text on pale surfaces).
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

  it("KPI tone surfaces use theme tokens (never bare pale hex backgrounds)", () => {
    for (const tone of ["success", "warning", "danger"]) {
      const block = css.match(
        new RegExp(`\\.admin-dash__kpi--${tone}\\s*\\{([\\s\\S]*?)\\n\\}`),
      )?.[1];
      assert.ok(block, `kpi--${tone} rule exists`);
      assert.match(
        block,
        new RegExp(`background:\\s*var\\(--admin-tone-${tone}-bg\\)`),
      );
      assert.match(
        block,
        new RegExp(`border-color:\\s*var\\(--admin-tone-${tone}-border\\)`),
      );
      assert.match(block, /color:\s*var\(--admin-ink\)/);
      assert.doesNotMatch(block, /background:\s*#f[0-9a-f]{5}/i);
    }

    // Tone text children stay on ink/muted tokens
    assert.match(
      css,
      /\.admin-dash__kpi--success \.admin-dash__kpi-value[\s\S]*color:\s*var\(--admin-ink\)/,
    );
  });

  it("dark theme remaps KPI tones and action section to dark surfaces", () => {
    const darkOps = css.match(
      /html\[data-theme="dark"\]\s*\.admin-ops\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    assert.ok(darkOps, "dark admin-ops token block exists");
    assert.match(darkOps, /--admin-tone-success-bg:\s*#143528/);
    assert.match(darkOps, /--admin-tone-warning-bg:\s*#2e2410/);
    assert.match(darkOps, /--admin-tone-danger-bg:\s*#3a1818/);
    assert.match(darkOps, /--admin-kpi-icon-bg:\s*#1a2336/);
    assert.match(darkOps, /--admin-action-section-top:\s*#2a2418/);
    assert.match(darkOps, /--admin-action-section-bottom:\s*#182234/);
    // Must not leave pale light values in the dark remap
    assert.doesNotMatch(darkOps, /--admin-tone-success-bg:\s*#f6fef9/);
    assert.doesNotMatch(darkOps, /--admin-action-section-bottom:\s*#ffffff/);
  });

  it("action section and KPI icon avoid hardcoded light hex", () => {
    const action = css.match(
      /\.admin-dash__section--action\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    assert.ok(action, "section--action exists");
    assert.match(action, /var\(--admin-action-section-top\)/);
    assert.match(action, /var\(--admin-action-section-bottom\)/);
    assert.match(action, /color:\s*var\(--admin-ink\)/);
    assert.doesNotMatch(action, /#fffaf3|#ffffff/);

    const icon = css.match(/\.admin-dash__kpi-icon\s*\{([\s\S]*?)\n\}/)?.[1];
    assert.ok(icon, "kpi-icon exists");
    assert.match(icon, /background:\s*var\(--admin-kpi-icon-bg\)/);
    assert.doesNotMatch(icon, /background:\s*#eef2f6/);
  });
});
