/**
 * PASSWORD_PEPPER must stay locked to the historical default once set in prod.
 * Run: node --test scripts/password-pepper-lock.test.mjs
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

describe("password pepper lock", () => {
  it("password hashing falls back to the historical default pepper", () => {
    const src = read("services/auth/password.service.ts");
    assert.match(
      src,
      /PASSWORD_PEPPER\s*=\s*process\.env\.PASSWORD_PEPPER\s*\?\?\s*"sooqna-password-pepper"/,
    );
  });

  it("production config warns only when PASSWORD_PEPPER env is unset", () => {
    const src = read("services/auth/production-config.ts");
    assert.match(src, /passwordPepperConfigured/);
    assert.match(src, /warnings\.push\("PASSWORD_PEPPER"\)/);
    assert.match(
      src,
      /process\.env\.PASSWORD_PEPPER\?\.trim\(\)/,
    );
  });

  it("docs say rotating the pepper invalidates passwords", () => {
    assert.match(
      read("PRODUCTION_DEPLOYMENT_GUIDE.md"),
      /PASSWORD_PEPPER[\s\S]*rotating invalidates passwords/,
    );
  });
});
