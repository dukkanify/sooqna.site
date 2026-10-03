/**
 * UAE mobile: smart format checks, no OTP. Prefill only from a real number.
 * Run: node --test --experimental-strip-types scripts/uae-phone.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  formatUaeMobileNational,
  isValidUaeMobile,
  listingPrefillPhone,
  normalizeUaePhone,
  toAsciiDigits,
} from "../shared/utils/phone.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("UAE mobile validation", () => {
  it("accepts formatted, +971, and Arabic digits", () => {
    assert.equal(isValidUaeMobile("0501234567"), true);
    assert.equal(isValidUaeMobile("050 123 4567"), true);
    assert.equal(isValidUaeMobile("+971501234567"), true);
    assert.equal(isValidUaeMobile("00971501234567"), true);
    assert.equal(isValidUaeMobile("٠٥٠١٢٣٤٥٦٧"), true);
    assert.equal(normalizeUaePhone("050 123 4567"), "+971501234567");
    assert.equal(formatUaeMobileNational("+971 50 123 4567"), "0501234567");
    assert.equal(toAsciiDigits("٠٥٠"), "050");
  });

  it("rejects empty, incomplete, landline, and junk", () => {
    assert.equal(isValidUaeMobile(""), false);
    assert.equal(isValidUaeMobile("   "), false);
    assert.equal(isValidUaeMobile("0"), false);
    assert.equal(isValidUaeMobile("+971"), false);
    assert.equal(isValidUaeMobile("971"), false);
    assert.equal(isValidUaeMobile("05"), false);
    assert.equal(isValidUaeMobile("04xxxxxxx"), false);
    assert.equal(isValidUaeMobile("042345678"), false);
    assert.equal(isValidUaeMobile("0555555555"), false);
    assert.equal(isValidUaeMobile("n/a"), false);
    assert.equal(isValidUaeMobile("05xxxxxxxx"), false);
  });

  it("does not prefill listing contact from a missing or fake profile phone", () => {
    assert.equal(listingPrefillPhone(""), "");
    assert.equal(listingPrefillPhone(undefined), "");
    assert.equal(listingPrefillPhone("+971"), "");
    assert.equal(listingPrefillPhone("0"), "");
    assert.equal(listingPrefillPhone("—"), "");
    assert.equal(listingPrefillPhone("0501234567"), "0501234567");
  });

  it("listing form only claims profile fill when a real number exists", () => {
    const form = read("features/listings/components/AddListingForm.tsx");
    const media = read("features/listings/components/add-listing/MediaContactStep.tsx");
    const input = read("shared/ui/UaePhoneInput.tsx");
    assert.match(form, /listingPrefillPhone/);
    assert.match(form, /filledFromProfile=\{Boolean\(defaultContact\)\}/);
    assert.match(media, /filledFromProfile/);
    assert.match(input, /filledFromProfile &&/);
    assert.match(input, /listingPrefillPhone\(value\) === prefilled/);
    assert.doesNotMatch(media, /defaultContact \? \(/);
  });
});
