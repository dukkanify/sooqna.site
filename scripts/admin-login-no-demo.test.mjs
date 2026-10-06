/**
 * Admin login must not show demo credentials; passwords are set in the desk.
 * Run: node --test --experimental-strip-types scripts/admin-login-no-demo.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { INVALID_CREDENTIALS_MESSAGE } from "../services/auth/auth-messages.ts";
import { parseNewPasswordPair } from "../shared/utils/password-rules.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin login copy", () => {
  it("does not print demo email/password on the admin gate", () => {
    const login = read("features/auth/components/LoginForm.tsx");
    assert.doesNotMatch(login, /admin@sooqna\.demo/);
    assert.doesNotMatch(login, /Admin@123/);
    assert.doesNotMatch(login, /تعبئة بيانات المدير/);
    assert.doesNotMatch(login, /حساب المدير التجريبي/);
    assert.doesNotMatch(login, /findDemoAccountByIdentifier/);
    assert.match(
      login,
      /تغيير كلمة المرور يتم من لوحة التحكم بعد الدخول/,
    );
  });

  it("invalid credentials do not send the buyer to forgot-password", () => {
    assert.equal(INVALID_CREDENTIALS_MESSAGE, "بيانات الدخول غير صحيحة.");
    const messages = read("services/auth/auth-messages.ts");
    assert.doesNotMatch(
      messages,
      /إذا غيّرت كلمة المرور مؤخرًا، استخدم «نسيت كلمة المرور»/,
    );
  });
});

describe("admin password from the control panel", () => {
  it("parses a strong matching password", () => {
    const parsed = parseNewPasswordPair({
      newPassword: "AdminNew9",
      confirmPassword: "AdminNew9",
    });
    assert.deepEqual(parsed, { password: "AdminNew9" });
  });

  it("rejects a weak or mismatched password", () => {
    assert.equal(
      "error" in parseNewPasswordPair({ newPassword: "short" }),
      true,
    );
    const mismatch = parseNewPasswordPair({
      newPassword: "AdminNew9",
      confirmPassword: "AdminNew8",
    });
    assert.equal("error" in mismatch && mismatch.error, "PASSWORD_MISMATCH");
  });

  it("settings and users desks can set a password without email reset", () => {
    const settings = read("features/admin/components/AdminSettingsPanel.tsx");
    const users = read("features/admin/components/AdminUsersPanel.tsx");
    const account = read("app/api/admin/account/password/route.ts");
    const patch = read("app/api/admin/users/[id]/route.ts");
    assert.match(settings, /\/api\/admin\/account\/password/);
    assert.match(settings, /حفظ كلمة المرور/);
    assert.match(users, /newPassword/);
    assert.match(users, /حفظ كلمة المرور/);
    assert.doesNotMatch(users, /رابط كلمة المرور/);
    assert.match(account, /applyAdminSetPassword/);
    assert.match(patch, /body\.newPassword/);
    assert.match(patch, /setSessionCookie/);
  });
});
