/**
 * English listing chrome leftovers: Report / No photo must localize.
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

describe("listing English chrome leftovers", () => {
  it("translates short Report and No photo labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["إبلاغ"], "Report");
    assert.equal(phrases["لا توجد صورة"], "No photo");
  });

  it("wraps empty gallery placeholder so English locale can translate it", () => {
    const src = read("features/listings/components/ListingGallery.tsx");
    assert.match(
      src,
      /galleryItems\.length === 0[\s\S]*LocalizedTree[\s\S]*لا توجد صورة/,
    );
  });

  it("keeps the listing toolbar Report label as a localizable string", () => {
    const src = read("features/listings/components/ListingDetailToolbar.tsx");
    assert.match(src, /إبلاغ/);
    assert.match(src, /LocalizedTree/);
  });
});
