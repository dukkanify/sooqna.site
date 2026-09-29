/**
 * Optional company / merchant name at register + profile edit.
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

describe("optional company / merchant name", () => {
  it("register APIs accept optional businessName", () => {
    assert.match(read("app/api/auth/register/route.ts"), /businessName/);
    assert.match(
      read("app/api/auth/register/request-otp/route.ts"),
      /businessName/,
    );
    assert.match(
      read("services/auth/user-store.ts"),
      /optionalBusinessName/,
    );
    assert.match(
      read("services/auth/user-store.ts"),
      /businessProfile:\s*\{[\s\S]*businessName/,
    );
  });

  it("RegisterForm exposes optional company name field", () => {
    const src = read("features/auth/components/RegisterForm.tsx");
    assert.match(src, /name="businessName"/);
    assert.match(src, /اسم الشركة \/ التاجر/);
    assert.match(src, /\.\.\.\(businessName \? \{ businessName \} : \{\}\)/);
  });

  it("ProfileForm edits and PATCHes businessName", () => {
    const form = read("features/profile/components/ProfileForm.tsx");
    const route = read("app/api/profile/route.ts");
    assert.match(form, /name="businessName"/);
    assert.match(form, /businessName,/);
    assert.match(route, /businessName:\s*z\.string\(\)\.trim\(\)\.max\(120\)\.optional\(\)/);
    assert.match(
      read("services/auth/user-store.ts"),
      /updateUserProfile[\s\S]*businessName/,
    );
  });

  it("seller display prefers businessProfile.businessName", () => {
    const add = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    const listings = read("app/api/listings/route.ts");
    assert.match(add, /businessProfile\?\.businessName/);
    assert.match(listings, /businessProfile\?\.businessName/);
  });

  it("EN phrases cover company name labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["اسم الشركة / التاجر"], "Company / merchant name");
    assert.equal(
      phrases["اختياري — يظهر كاسم التاجر على إعلاناتك"],
      "Optional — shown as your merchant name on listings",
    );
  });
});
