/**
 * Listing spec labels/values must be Arabic, never camelCase API keys.
 * Run: node --test --experimental-strip-types scripts/listing-spec-labels.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  humanizeSpecKey,
  looksLikeApiKey,
  translateSpecValueToken,
} from "../shared/listings/spec-labels.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("spec labels are Arabic, not API keys", () => {
  it("maps reported leftover keys to Arabic names", () => {
    const cases = {
      priceBasis: "أساس السعر",
      advertiserRole: "نوع المعلن",
      advertiserType: "نوع المعلن",
      bookTitle: "عنوان الكتاب",
      condition: "الحالة",
      sportType: "نوع الرياضة",
      size: "المقاس",
    };
    for (const [key, label] of Object.entries(cases)) {
      assert.equal(humanizeSpecKey(key), label);
      assert.equal(looksLikeApiKey(humanizeSpecKey(key)), false);
    }
  });

  it("humanizes snake_case and unknown camelCase without dumping the key", () => {
    assert.equal(humanizeSpecKey("price_basis"), "أساس السعر");
    assert.equal(humanizeSpecKey("advertiser-role"), "نوع المعلن");
    const unknown = humanizeSpecKey("shoeSize");
    assert.match(unknown, /مقاس/);
    assert.equal(looksLikeApiKey(unknown), false);
  });

  it("translates stored English enum values", () => {
    assert.equal(translateSpecValueToken("yearly"), "سنوي");
    assert.equal(translateSpecValueToken("Yearly"), "سنوي");
    assert.equal(translateSpecValueToken("owner"), "مالك");
    assert.equal(translateSpecValueToken("broker"), "وسيط");
    assert.equal(translateSpecValueToken("new"), "جديد");
    assert.equal(translateSpecValueToken("used"), "مستعمل");
    assert.equal(translateSpecValueToken("vacancy"), "توظيف");
    assert.equal(translateSpecValueToken("wholesale"), "بالجملة");
    assert.equal(translateSpecValueToken("football"), "كرة القدم");
    assert.equal(translateSpecValueToken("محمد بن زايد"), "محمد بن زايد");
  });

  it("listing specs and search chips share formatSpecLabel/formatSpecValue", () => {
    const specs = read("shared/listings/listing-specs.ts");
    const chips = read("features/search/components/SearchFilterChips.tsx");
    const fields = read("shared/constants/category-fields.ts");
    const display = read("shared/listings/spec-display.ts");
    assert.match(specs, /formatSpecEntry/);
    assert.match(chips, /formatSpecLabel/);
    assert.match(chips, /formatSpecValue/);
    assert.match(fields, /humanizeSpecKey/);
    assert.doesNotMatch(fields, /field\?\.label \?\? key/);
    assert.match(display, /export function formatSpecLabel/);
    assert.match(display, /export function formatSpecValue/);
    assert.match(display, /getFormTemplateFields/);
  });
});
