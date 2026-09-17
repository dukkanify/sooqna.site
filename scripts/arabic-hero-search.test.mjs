/**
 * Guard against hero-search Arabic shaping bugs
 * (transparent select text + absolute label overlay doubles glyphs).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("hero search does not overlay fake labels on transparent selects", () => {
  const tsx = readFileSync(
    path.join(root, "features/home/components/marketplace/MarketHeroSearch.tsx"),
    "utf8",
  );
  const css = readFileSync(path.join(root, "app/globals.css"), "utf8");

  assert.doesNotMatch(tsx, /chip-text/);
  assert.match(tsx, /market-hero-search__control/);
  assert.match(css, /\.market-hero-search__select\s*\{[^}]*color:\s*var\(--color-ink\)/s);
  assert.doesNotMatch(
    css,
    /\.market-hero-search__select\s*\{[^}]*color:\s*transparent/s,
  );
  assert.doesNotMatch(css, /market-hero-search__chip-text/);
});

test("mobile home search keeps visible select text (no transparent value)", () => {
  const css = readFileSync(
    path.join(root, "features/home/components/mobile/mobile-home.css"),
    "utf8",
  );
  assert.match(
    css,
    /\.mobile-home-search-card__select\s*\{[^}]*color:\s*var\(--mh-primary\)/s,
  );
  assert.doesNotMatch(
    css,
    /\.mobile-home-search-card__select\s*\{[^}]*color:\s*transparent/s,
  );
});
