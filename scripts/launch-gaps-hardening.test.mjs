/**
 * Launch hardening — demo accounts off on Vercel, durable rate limits,
 * purge-demo ops, production config surfacing peppers/S3.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  isDemoAccountEmail,
  isDemoAccountsAllowed,
  shouldSeedDemoAccounts,
} from "../services/auth/demo-accounts-policy.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("launch gaps hardening", () => {
  it("demo account emails are detected", () => {
    assert.equal(isDemoAccountEmail("admin@sooqna.demo"), true);
    assert.equal(isDemoAccountEmail("x@uaesales.demo"), true);
    assert.equal(isDemoAccountEmail("real@sooqnauae.com"), false);
  });

  it("demo seeding is off on Vercel production/preview by default", () => {
    const prev = {
      ALLOW_DEMO_ACCOUNTS: process.env.ALLOW_DEMO_ACCOUNTS,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
    };
    try {
      delete process.env.ALLOW_DEMO_ACCOUNTS;
      process.env.VERCEL_ENV = "production";
      assert.equal(isDemoAccountsAllowed(), false);
      assert.equal(shouldSeedDemoAccounts(), false);
      process.env.VERCEL_ENV = "preview";
      assert.equal(isDemoAccountsAllowed(), false);
      process.env.ALLOW_DEMO_ACCOUNTS = "true";
      assert.equal(isDemoAccountsAllowed(), true);
    } finally {
      for (const [key, value] of Object.entries(prev)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it("password login blocks demo emails when demo accounts disallowed", () => {
    const src = read("app/api/auth/login/password/route.ts");
    assert.match(src, /isDemoAccountEmail/);
    assert.match(src, /isDemoAccountsAllowed/);
    assert.match(src, /INVALID_CREDENTIALS/);
  });

  it("ensureDemoAccounts respects shouldSeedDemoAccounts", () => {
    const src = read("services/auth/user-store.ts");
    assert.match(src, /shouldSeedDemoAccounts/);
  });

  it("auth rate limits use durable postgres-backed store", () => {
    const src = read("services/auth/rate-limit.ts");
    assert.match(src, /createPayloadCollectionStore/);
    assert.match(src, /auth_rate_limits/);
    assert.doesNotMatch(src, /from "\$\{?@\/services\/payments\/data-store/);
    assert.doesNotMatch(src, /from "@\/services\/payments\/data-store"/);
  });

  it("admin purge-demo ops route exists", () => {
    const src = read("app/api/admin/ops/purge-demo/route.ts");
    assert.match(src, /purgeDemoOpsData/);
    assert.match(src, /requireAdminPermission\("orders", "delete"\)/);
    assert.match(read("services/admin/purge-demo-ops.ts"), /isNonLiveOpsOrder/);
  });

  it("production config reports OTP pepper, S3, and demo policy", () => {
    const src = read("services/auth/production-config.ts");
    assert.match(src, /otpPepperConfigured/);
    assert.match(src, /objectStorageConfigured/);
    assert.match(src, /demoAccountsAllowed/);
    assert.match(src, /warnings/);
  });

  it("docs and brand point at sooqnauae.com", () => {
    assert.match(read("AGENTS.md"), /sooqnauae\.com/);
    assert.match(read("PRODUCTION_DEPLOYMENT_GUIDE.md"), /sooqnauae\.com/);
    assert.doesNotMatch(
      read("PRODUCTION_DEPLOYMENT_GUIDE.md"),
      /sooqna\.site/,
    );
    assert.match(
      read("shared/i18n/phrases.en.json"),
      /support@sooqnauae\.com/,
    );
  });
});
