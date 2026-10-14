/**
 * Sitewide speed / scroll-jank — opaque sticky chrome + card deferral.
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

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("sitewide speed / jank", () => {
  it("shared mobile bottom nav has no backdrop-filter", () => {
    const css = stripComments(read("styles/mobile-chrome.css"));
    const block = css.match(/\.mobile-bottom-nav\s*\{[^}]+\}/)?.[0];
    assert.ok(block);
    assert.doesNotMatch(block, /backdrop-filter/);
  });

  it("SiteHeader sticky bar is opaque (no backdrop blur)", () => {
    const src = read("shared/layouts/SiteHeader.tsx");
    assert.match(src, /sticky top-0/);
    assert.match(src, /bg-surface(?!\/)/);
    assert.doesNotMatch(src, /backdrop-blur/);
  });

  it("listing sticky CTA bar has no backdrop-filter", () => {
    const css = stripComments(
      read("features/listings/components/mobile-sticky-action-bar.css"),
    );
    const block = css.match(/\.mobile-sticky-bar\s*\{[^}]+\}/)?.[0];
    assert.ok(block);
    assert.doesNotMatch(block, /backdrop-filter/);
  });

  it("search sticky filter chip bar has no backdrop-blur", () => {
    const src = read("features/search/components/SearchFilters.tsx");
    assert.match(src, /sticky top-\[4\.25rem\]/);
    assert.doesNotMatch(src, /backdrop-blur/);
  });

  it("marketplace cards use content-visibility for long grids", () => {
    const css = stripComments(read("app/globals.css"));
    const block = css.match(/\.marketplace-card\s*\{[^}]+\}/)?.[0];
    assert.ok(block);
    assert.match(block, /content-visibility:\s*auto/);
    assert.match(block, /contain-intrinsic-size/);
  });

  it("featured badge sheen is not an infinite animation", () => {
    const css = stripComments(
      read("features/listings/components/featured-badge.css"),
    );
    const sheen = css.match(
      /\.listing-featured-badge__sheen\s*\{[^}]+\}/,
    )?.[0];
    assert.ok(sheen);
    assert.doesNotMatch(sheen, /infinite/);
    assert.doesNotMatch(sheen, /animation\s*:/);
  });

  it("listing gallery controls skip backdrop-blur", () => {
    const src = read("features/listings/components/ListingGallery.tsx");
    assert.doesNotMatch(src, /backdrop-blur/);
  });

  it("checkout sticky actions skip backdrop-blur", () => {
    const src = read("features/checkout/components/CheckoutWizard.tsx");
    assert.doesNotMatch(src, /backdrop-blur/);
  });
});
