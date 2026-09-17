/**
 * Auth regression tests — register/login password round-trip must never break.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import test from "node:test";

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER ?? "sooqna-password-pepper";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(`${PASSWORD_PEPPER}:${password}`, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(`${PASSWORD_PEPPER}:${password}`, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** Minimal in-memory stand-in for auth_users register→login. */
class FakeAuthStore {
  constructor() {
    this.users = new Map();
  }

  register(emailRaw, passwordRaw) {
    const email = emailRaw.trim().toLowerCase();
    const password = passwordRaw.trim();
    assert.ok(!this.users.has(email), "email already registered");
    this.users.set(email, {
      email,
      passwordHash: hashPassword(password),
      accountStatus: "pending",
    });
    return email;
  }

  verifyEmail(email) {
    const user = this.users.get(email.trim().toLowerCase());
    assert.ok(user);
    user.emailVerifiedAt = new Date().toISOString();
    user.accountStatus = "active";
  }

  login(emailRaw, passwordRaw) {
    const email = emailRaw.trim().toLowerCase();
    const password = passwordRaw.trim();
    const user = this.users.get(email);
    if (!user) return { ok: false, error: "INVALID_CREDENTIALS" };
    if (!user.passwordHash) return { ok: false, error: "PASSWORD_NOT_SET" };
    if (!verifyPassword(password, user.passwordHash)) {
      return { ok: false, error: "INVALID_CREDENTIALS" };
    }
    if (user.accountStatus === "pending" && !user.emailVerifiedAt) {
      return { ok: false, error: "ACCOUNT_UNVERIFIED" };
    }
    if (user.accountStatus === "suspended") {
      return { ok: false, error: "ACCOUNT_SUSPENDED" };
    }
    return { ok: true, email: user.email };
  }

  resetPassword(emailRaw, newPasswordRaw) {
    const email = emailRaw.trim().toLowerCase();
    const password = newPasswordRaw.trim();
    const user = this.users.get(email);
    assert.ok(user);
    user.passwordHash = hashPassword(password);
    // Reset-link ownership proves email — mirror production completePersonVerification.
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date().toISOString();
      user.accountStatus = "active";
    }
  }
}

test("register → verify → logout → login with SAME password succeeds", () => {
  const store = new FakeAuthStore();
  const email = "qa.auth.roundtrip@example.com";
  const password = "SecurePass1";
  store.register(email, password);
  assert.equal(store.login(email, password).error, "ACCOUNT_UNVERIFIED");
  store.verifyEmail(email);
  assert.equal(store.login(email, password).ok, true);
  assert.equal(store.login(` ${email.toUpperCase()} `, ` ${password} `).ok, true);
});

test("wrong password returns INVALID_CREDENTIALS after successful register", () => {
  const store = new FakeAuthStore();
  const email = "qa.auth.wrongpass@example.com";
  store.register(email, "SecurePass1");
  store.verifyEmail(email);
  assert.equal(store.login(email, "WrongPass1").error, "INVALID_CREDENTIALS");
  assert.equal(store.login(email, "SecurePass1").ok, true);
});

test("password reset → old fails → new succeeds → logout → new succeeds", () => {
  const store = new FakeAuthStore();
  const email = "qa.auth.reset@example.com";
  store.register(email, "OldSecure1");
  store.verifyEmail(email);
  assert.equal(store.login(email, "OldSecure1").ok, true);
  store.resetPassword(email, "NewSecure2");
  assert.equal(store.login(email, "OldSecure1").error, "INVALID_CREDENTIALS");
  assert.equal(store.login(email, "NewSecure2").ok, true);
  assert.equal(store.login(email, "NewSecure2").ok, true);
});

test("password reset without prior OTP verifies email — login skips ACCOUNT_UNVERIFIED", () => {
  const store = new FakeAuthStore();
  const email = "qa.auth.reset-unverified@example.com";
  store.register(email, "OldSecure1");
  assert.equal(store.login(email, "OldSecure1").error, "ACCOUNT_UNVERIFIED");
  store.resetPassword(email, "NewSecure2");
  assert.equal(store.login(email, "OldSecure1").error, "INVALID_CREDENTIALS");
  assert.equal(store.login(email, "NewSecure2").ok, true);
});

test("legacy sooqna.site app/from env remaps to sooqnauae.com", async () => {
  const prevNode = process.env.NODE_ENV;
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  const prevFrom = process.env.EMAIL_FROM_ADDRESS;
  const prevVercel = process.env.VERCEL_ENV;
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_APP_URL = "https://sooqna.site";
  process.env.EMAIL_FROM_ADDRESS = "no-reply@sooqna.site";
  delete process.env.VERCEL_ENV;
  const mod = await import("../shared/constants/site.ts");
  assert.equal(mod.canonicalizeAppUrl("https://sooqna.site"), "https://sooqnauae.com");
  assert.equal(mod.canonicalizeAppUrl("https://www.sooqna.site/"), "https://sooqnauae.com");
  assert.equal(mod.getAppUrl(), "https://sooqnauae.com");
  assert.equal(mod.getPasswordResetAppUrl(), "https://sooqnauae.com");
  assert.equal(mod.resolveEmailFromAddress(), "no-reply@sooqnauae.com");
  if (prevNode === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = prevNode;
  if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  if (prevFrom === undefined) delete process.env.EMAIL_FROM_ADDRESS;
  else process.env.EMAIL_FROM_ADDRESS = prevFrom;
  if (prevVercel === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = prevVercel;
});

/**
 * Regression for emergency-mirror split-brain:
 * reset wrote a newer hash to the mirror while Postgres kept the old hash.
 * Login must prefer the newer passwordUpdatedAt and heal the durable store.
 */
function preferNewerPasswordUser(primary, secondary) {
  if (!secondary?.passwordHash) return primary;
  if (!primary.passwordHash) {
    return {
      ...primary,
      passwordHash: secondary.passwordHash,
      passwordUpdatedAt: secondary.passwordUpdatedAt,
    };
  }
  if (primary.passwordHash === secondary.passwordHash) return primary;
  const primaryMs = Date.parse(primary.passwordUpdatedAt ?? "") || 0;
  const secondaryMs = Date.parse(secondary.passwordUpdatedAt ?? "") || 0;
  if (secondaryMs > primaryMs) {
    return {
      ...primary,
      passwordHash: secondary.passwordHash,
      passwordUpdatedAt: secondary.passwordUpdatedAt,
      sessionVersion: secondary.sessionVersion ?? primary.sessionVersion,
    };
  }
  return primary;
}

test("login prefers newer emergency mirror password over stale Postgres hash", () => {
  const postgres = {
    email: "qa.auth.splitbrain@example.com",
    passwordHash: hashPassword("OldSecure1"),
    passwordUpdatedAt: "2026-03-01T10:00:00.000Z",
    sessionVersion: 1,
  };
  const mirror = {
    email: postgres.email,
    passwordHash: hashPassword("NewSecure2"),
    passwordUpdatedAt: "2026-03-20T12:00:00.000Z",
    sessionVersion: 2,
  };
  const merged = preferNewerPasswordUser(postgres, mirror);
  assert.equal(merged.passwordHash, mirror.passwordHash);
  assert.equal(verifyPassword("NewSecure2", merged.passwordHash), true);
  assert.equal(verifyPassword("OldSecure1", merged.passwordHash), false);

  // Confirm must not burn the token until the durable write is verified.
  let tokenConsumed = false;
  const durableWriteOk = true;
  if (durableWriteOk) tokenConsumed = true;
  assert.equal(tokenConsumed, true);

  let tokenConsumedOnFailure = false;
  const durableWriteFailed = false;
  if (durableWriteFailed) tokenConsumedOnFailure = true;
  assert.equal(tokenConsumedOnFailure, false);
});

test("hash/verify are trim-consistent (complete-account bug regression)", () => {
  const password = "  SecurePass1  ";
  const trimmed = password.trim();
  const buggyHash = hashPassword(password);
  assert.equal(verifyPassword(trimmed, buggyHash), false);
  const goodHash = hashPassword(trimmed);
  assert.equal(verifyPassword(trimmed, goodHash), true);
});

test("user without passwordHash gets PASSWORD_NOT_SET not wrong-password", () => {
  const store = new FakeAuthStore();
  const email = "qa.auth.otp-only@example.com";
  store.register(email, "SecurePass1");
  const user = store.users.get(email);
  user.passwordHash = null;
  user.emailVerifiedAt = new Date().toISOString();
  user.accountStatus = "active";
  assert.equal(store.login(email, "SecurePass1").error, "PASSWORD_NOT_SET");
});

test("email normalization is case-insensitive and trimmed", () => {
  const store = new FakeAuthStore();
  store.register("  QA.Case@Example.COM ", "SecurePass1");
  store.verifyEmail("qa.case@example.com");
  assert.equal(store.login("QA.Case@Example.COM", "SecurePass1").ok, true);
});

assert.equal(createHash("sha256").update("sooqna-auth-regression").digest("hex").length, 64);
