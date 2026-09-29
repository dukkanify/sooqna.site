/**
 * Secure profile email-change contract.
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

describe("profile email change", () => {
  it("keeps identity email out of profile PATCH schema", () => {
    const route = read("app/api/profile/route.ts");
    assert.match(route, /profilePatchSchema/);
    assert.doesNotMatch(route, /email:\s*z\.string/);
  });

  it("stores pendingEmail until OTP confirm applies the change", () => {
    const user = read("types/domain/user.ts");
    assert.match(user, /pendingEmail\?:/);

    const store = read("services/auth/user-store.ts");
    assert.match(store, /export async function setPendingEmail/);
    assert.match(store, /export async function applyEmailChange/);
    assert.match(store, /emailVerifiedAt:\s*now/);
    assert.match(store, /pendingEmail:\s*null/);

    const service = read("services/auth/email-change.service.ts");
    assert.match(service, /requestEmailChange/);
    assert.match(service, /confirmEmailChange/);
    assert.match(service, /purpose:\s*"EMAIL_CHANGE"/);
    assert.match(service, /purpose:\s*"SENSITIVE_ACTION"/);
  });

  it("exposes request/confirm/reauth/resend/cancel API routes", () => {
    for (const rel of [
      "app/api/profile/email/request/route.ts",
      "app/api/profile/email/confirm/route.ts",
      "app/api/profile/email/reauth/route.ts",
      "app/api/profile/email/resend/route.ts",
      "app/api/profile/email/cancel/route.ts",
    ]) {
      const src = read(rel);
      assert.match(src, /requireSessionUser/);
      assert.match(src, /export async function POST/);
    }
  });

  it("wires secure UI on the profile form", () => {
    const form = read("features/profile/components/ProfileForm.tsx");
    assert.match(form, /ChangeEmailSection/);
    assert.match(form, /disabled/);
    assert.match(form, /name="email"/);

    const section = read("features/profile/components/ChangeEmailSection.tsx");
    assert.match(section, /\/api\/profile\/email\/request/);
    assert.match(section, /\/api\/profile\/email\/confirm/);
    assert.match(section, /purpose=\"EMAIL_CHANGE\"/);
    assert.match(section, /كلمة المرور/);
  });

  it("maps EMAIL_CHANGE OTP verify to profile confirm", () => {
    const otp = read("features/auth/components/OtpVerification.tsx");
    assert.match(otp, /EMAIL_CHANGE:\s*"\/api\/profile\/email\/confirm"/);
    assert.match(otp, /resendEndpoint/);
  });

  it("keeps EMAIL_CHANGE OTP when email delivery fails", () => {
    const handlers = read("services/auth/auth-handlers.ts");
    assert.match(handlers, /purpose === "EMAIL_CHANGE"/);
    assert.match(handlers, /clearOtpResendCooldown/);
    assert.match(
      handlers,
      /purpose === "REGISTER"[\s\S]*EMAIL_CHANGE[\s\S]*SENSITIVE_ACTION/,
    );
    // Must not invalidate the OTP record on soft delivery failure for these purposes.
    const softKeep = handlers.match(
      /Keep OTP when delivery fails[\s\S]*?return \{ delivered: false, code \}/,
    );
    assert.ok(softKeep, "soft-fail keep-OTP branch missing");
    assert.doesNotMatch(softKeep[0], /invalidateOtpRecord/);
  });
});
