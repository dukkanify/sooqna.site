/**
 * Real estate license fields: Madmoon license, BRN (DLD), BLN (ADREC).
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fieldVisibleForSpecs,
  matchesFieldPattern,
} from "../shared/listings/category-field-visibility.ts";
import {
  expectsBln,
  expectsBrn,
  RE_LICENSE_PATTERNS,
  regulatorEmirateError,
} from "../shared/listings/real-estate-license.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("category field visibility AND + patterns", () => {
  it("requires all showWhen rules (AND)", () => {
    const field = {
      showWhen: [
        { key: "advertiserType", values: ["broker"] },
        { key: "regulatoryAuthority", values: ["DLD"] },
      ],
    };
    assert.equal(
      fieldVisibleForSpecs(field, {
        advertiserType: "broker",
        regulatoryAuthority: "DLD",
      }),
      true,
    );
    assert.equal(
      fieldVisibleForSpecs(field, {
        advertiserType: "broker",
        regulatoryAuthority: "ADREC",
      }),
      false,
    );
  });

  it("validates license number formats", () => {
    assert.equal(RE_LICENSE_PATTERNS.brn.test("123456"), true);
    assert.equal(RE_LICENSE_PATTERNS.brn.test("12"), false);
    assert.equal(RE_LICENSE_PATTERNS.bln.test("AD-12345"), true);
    assert.equal(RE_LICENSE_PATTERNS.licenseNumber.test("ORN-99887"), true);
    assert.equal(
      matchesFieldPattern(
        {
          pattern: "^\\d{5,8}$",
          patternMessage: "BRN يجب أن يكون رقماً من 5 إلى 8 خانات.",
          label: "BRN",
        },
        "12",
      ),
      "BRN يجب أن يكون رقماً من 5 إلى 8 خانات.",
    );
  });
});

describe("real estate regulator rules", () => {
  it("flags DLD outside Dubai and ADREC outside Abu Dhabi", () => {
    assert.match(
      regulatorEmirateError("broker", "DLD", "أبوظبي") ?? "",
      /دبي/,
    );
    assert.match(
      regulatorEmirateError("broker", "ADREC", "دبي") ?? "",
      /أبوظبي/,
    );
    assert.equal(regulatorEmirateError("broker", "DLD", "دبي"), undefined);
    assert.equal(regulatorEmirateError("owner", "DLD", "أبوظبي"), undefined);
  });

  it("expects BRN for DLD brokers and BLN for ADREC brokers", () => {
    assert.equal(
      expectsBrn({ advertiserType: "broker", regulatoryAuthority: "DLD" }),
      true,
    );
    assert.equal(
      expectsBln({ advertiserType: "broker", regulatoryAuthority: "ADREC" }),
      true,
    );
    assert.equal(
      expectsBrn({ advertiserType: "owner", regulatoryAuthority: "DLD" }),
      false,
    );
  });
});

describe("real estate license field wiring", () => {
  it("realEstateFields include license + BRN + BLN with showWhen AND", () => {
    const src = read("shared/constants/category-fields.ts");
    assert.match(src, /key:\s*"licenseNumber"/);
    assert.match(src, /key:\s*"brn"/);
    assert.match(src, /key:\s*"bln"/);
    assert.match(src, /key:\s*"advertiserType"/);
    assert.match(src, /key:\s*"regulatoryAuthority"/);
    assert.match(src, /مضمون/);
    assert.match(src, /regulatoryAuthority\",\s*values:\s*\["DLD"\]/);
    assert.match(src, /regulatoryAuthority\",\s*values:\s*\["ADREC"\]/);
    assert.match(src, /pattern:\s*"\^\\\\d\{5,8\}\$"/);
  });

  it("parseCategoryForm uses visibility + pattern + regulator helpers", () => {
    const src = read(
      "features/listings/components/add-listing/category-form-utils.ts",
    );
    assert.match(src, /fieldVisibleForSpecs/);
    assert.match(src, /matchesFieldPattern/);
    assert.match(src, /regulatorEmirateError/);
  });

  it("CategoryFieldsForm uses shared fieldVisibleForSpecs", () => {
    const src = read(
      "features/listings/components/add-listing/CategoryFieldsForm.tsx",
    );
    assert.match(src, /fieldVisibleForSpecs/);
    assert.doesNotMatch(src, /function fieldVisible\(/);
  });

  it("resolveCategoryFields appends missing default license keys", () => {
    const src = read("services/admin/category-form-store.ts");
    assert.match(src, /Append any newer code-default keys/);
    assert.match(src, /missing\.length/);
  });

  it("EN phrases cover license labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["رقم الترخيص"], "License number");
    assert.equal(phrases["BRN (DLD)"], "BRN (DLD)");
    assert.equal(phrases["BLN (ADREC)"], "BLN (ADREC)");
    assert.equal(phrases["الجهة التنظيمية"], "Regulatory authority");
  });
});
