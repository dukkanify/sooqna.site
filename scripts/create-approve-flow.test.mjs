/**
 * Create → submit → admin approve → public catalog.
 * Source-level guarantees (HTTP E2E runs locally with demo accounts).
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

describe("create to approve listing flow", () => {
  it("new public creates always enter pending_review (never self-active)", () => {
    const route = read("app/api/listings/route.ts");
    assert.match(route, /requestedStatus === "draft"/);
    assert.match(route, /pending_review/);
    assert.match(route, /isMarketplaceAccountReady/);
    assert.match(
      route,
      /requestedStatus === "active" && existing\?\.status === "active"/,
    );
  });

  it("admin PATCH can activate and persists status", () => {
    const admin = read("app/api/admin/listings/[id]/route.ts");
    assert.match(admin, /patchListingRecord/);
    assert.match(admin, /notifyListingApproved/);
    assert.match(admin, /LISTING_STATUS_PERSIST_FAILED/);

    const store = read("services/listings/listing-store.ts");
    assert.match(store, /patch.status === "active"/);
    assert.match(store, /previous.status === "pending_review"/);
    assert.match(store, /LISTING_STATUS_PERSIST_FAILED/);
  });

  it("public browse treats status=active as active+reserved only", () => {
    const queries = read("services/listings/listing-queries.ts");
    assert.match(
      queries,
      /query.status === "active"[\s\S]*listing.status === "reserved"/,
    );
    assert.doesNotMatch(
      queries,
      /pending_review[\s\S]{0,80}query.status === "active"/,
    );
  });

  it("demo logins stay off on Vercel so production Create→Approve needs a real account", () => {
    const policy = read("services/auth/demo-accounts-policy.ts");
    assert.match(policy, /ALLOW_DEMO_ACCOUNTS === "false"/);
    assert.match(policy, /VERCEL_ENV === "production"/);
  });
});
