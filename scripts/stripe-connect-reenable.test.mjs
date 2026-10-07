/**
 * Stripe Connect platform latch can recover after Dashboard enable.
 * Run: node --test --experimental-strip-types scripts/stripe-connect-reenable.test.mjs
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

describe("stripe connect re-enable", () => {
  it("probes again after a durable disabled latch", () => {
    const service = read("services/payments/stripe-connect.service.ts");
    assert.match(service, /export async function probePlatformConnectEnabled/);
    assert.match(service, /markPlatformConnectEnabled/);
    assert.match(service, /setStoredConnectSignupEnabled\(true\)/);
    // Must not short-circuit forever on stored === false without probing.
    assert.doesNotMatch(
      service,
      /if \(stored === false\) \{\s*cachedPlatformConnectEnabled = false;\s*return false;/,
    );
  });

  it("refresh paths force a Connect capability probe", () => {
    const seller = read("app/api/seller/stripe/connect/route.ts");
    const admin = read("app/api/admin/stripe/connect/route.ts");
    assert.match(seller, /probePlatformConnectEnabled\(\{ force: true \}\)/);
    assert.match(admin, /probe-connect/);
    assert.match(admin, /probePlatformConnectEnabled\(\{\s*force: true/);
  });

  it("unknown seller Connect errors are retryable, not permanent off", async () => {
    const { sellerConnectPublicMessage } = await import(
      "../services/payments/stripe-connect-errors.ts"
    );
    const message = sellerConnectPublicMessage(new Error("rate_limit"));
    assert.match(message, /تحديث الحالة/);
    assert.doesNotMatch(message, /غير مفعّل على المنصة حالياً/);
  });
});
