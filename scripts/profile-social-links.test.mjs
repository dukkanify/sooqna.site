/**
 * Optional profile social links + URL validation + public visibility.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  listFilledSocialLinks,
  normalizeSocialUrl,
  sanitizeSocialLinks,
} from "../shared/validation/social-links.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("social link URL validation", () => {
  it("accepts https Instagram and normalizes bare hosts", () => {
    assert.equal(
      normalizeSocialUrl("instagram", "instagram.com/sooqna"),
      "https://instagram.com/sooqna",
    );
    assert.equal(
      normalizeSocialUrl("instagram", "https://www.instagram.com/sooqna"),
      "https://www.instagram.com/sooqna",
    );
  });

  it("rejects wrong host and empty clears", () => {
    assert.equal(normalizeSocialUrl("instagram", "https://evil.com/x"), null);
    assert.equal(normalizeSocialUrl("facebook", ""), undefined);
    assert.equal(normalizeSocialUrl("website", "https://sooqna.ae"), "https://sooqna.ae/");
  });

  it("sanitizeSocialLinks keeps valid and drops empties", () => {
    const result = sanitizeSocialLinks({
      instagram: "https://instagram.com/a",
      facebook: "",
      x: "https://not-twitter.com/a",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.platform, "x");

    const ok = sanitizeSocialLinks({
      instagram: "https://instagram.com/a",
      facebook: "  ",
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.links.instagram, "https://instagram.com/a");
      assert.equal(ok.links.facebook, undefined);
    }
  });

  it("listFilledSocialLinks only returns filled platforms", () => {
    assert.deepEqual(
      listFilledSocialLinks({ instagram: "https://instagram.com/a", website: "" }),
      [{ platform: "instagram", url: "https://instagram.com/a" }],
    );
  });
});

describe("profile social links wiring", () => {
  it("UserProfile stores socialLinks + socialLinksPublic", () => {
    const src = read("types/domain/user.ts");
    assert.match(src, /socialLinks\?:/);
    assert.match(src, /socialLinksPublic\?:/);
  });

  it("profile PATCH validates and persists social fields", () => {
    const route = read("app/api/profile/route.ts");
    const store = read("services/auth/user-store.ts");
    assert.match(route, /sanitizeSocialLinks/);
    assert.match(route, /socialLinksPublic/);
    assert.match(store, /socialLinksPublic/);
  });

  it("ProfileForm edits optional links and public toggle", () => {
    const form = read("features/profile/components/ProfileForm.tsx");
    const fields = read("features/profile/components/ProfileSocialLinksFields.tsx");
    assert.match(form, /ProfileSocialLinksFields/);
    assert.match(form, /socialLinksPublic/);
    assert.match(fields, /name="socialLinksPublic"/);
    assert.match(fields, /روابط التواصل الاجتماعي/);
  });

  it("seller page shows links only when public", () => {
    const page = read("app/sellers/[id]/page.tsx");
    const component = read("features/sellers/components/SellerSocialLinks.tsx");
    const service = read("services/sellers/seller-profile.service.ts");
    assert.match(page, /SellerSocialLinks/);
    assert.match(page, /findUserById/);
    assert.match(component, /if \(!publicVisible\) return null/);
    assert.match(service, /Fall back to registered account/);
  });

  it("EN phrases cover social link copy", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["روابط التواصل الاجتماعي"], "Social media links");
    assert.equal(
      phrases["إظهار روابط التواصل للعامة على صفحة البائع"],
      "Show social links publicly on the seller page",
    );
  });
});
