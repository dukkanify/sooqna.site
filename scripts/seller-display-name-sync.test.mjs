/**
 * Profile rename → listing seller.name sync contract.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applySellerDisplayNameToListings,
  sellerDisplayNameFromProfile,
} from "../shared/listings/seller-display-name.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("seller display name source", () => {
  it("prefers businessName over fullName", () => {
    assert.equal(
      sellerDisplayNameFromProfile({
        fullName: "أحمد",
        businessProfile: { businessName: "معرض النور" },
      }),
      "معرض النور",
    );
    assert.equal(
      sellerDisplayNameFromProfile({ fullName: "سارة" }),
      "سارة",
    );
    assert.equal(
      sellerDisplayNameFromProfile({
        fullName: "سارة",
        businessProfile: { businessName: "  " },
      }),
      "سارة",
    );
  });

  it("updates only that seller’s listings when the name changed", () => {
    const rows = [
      { id: "a", seller: { id: "s1", name: "قديم" } },
      { id: "b", seller: { id: "s1", name: "قديم" } },
      { id: "c", seller: { id: "s2", name: "آخر" } },
      { id: "d", seller: { id: "s1", name: "جديد" } },
    ];
    const { changed, listings } = applySellerDisplayNameToListings(
      rows,
      "s1",
      "جديد",
    );
    assert.equal(changed, 2);
    assert.deepEqual(
      listings.map((row) => [row.id, row.seller.name]),
      [
        ["a", "جديد"],
        ["b", "جديد"],
        ["c", "آخر"],
        ["d", "جديد"],
      ],
    );
  });

  it("no-ops on empty name or unknown seller", () => {
    const rows = [{ id: "a", seller: { id: "s1", name: "قديم" } }];
    assert.equal(applySellerDisplayNameToListings(rows, "s1", "  ").changed, 0);
    assert.equal(applySellerDisplayNameToListings(rows, "missing", "جديد").changed, 0);
  });
});

describe("profile rename sync wiring", () => {
  it("exposes updateSellerListingDisplayName and profile/onboarding call it", () => {
    const store = read("services/listings/listing-store.ts");
    assert.match(store, /export async function updateSellerListingDisplayName/);

    const profile = read("app/api/profile/route.ts");
    assert.match(profile, /updateSellerListingDisplayName/);
    assert.match(profile, /sellerDisplayNameFromProfile/);

    const onboarding = read("app/api/auth/business/onboarding/route.ts");
    assert.match(onboarding, /updateSellerListingDisplayName/);
  });

  it("profile form refreshes local listing snapshots after save", () => {
    const form = read("features/profile/components/ProfileForm.tsx");
    assert.match(form, /syncLocalListingsSellerDisplayName/);
    assert.match(form, /sellerDisplayNameFromProfile/);

    const client = read("services/storage/client-storage.ts");
    assert.match(client, /export function syncLocalListingsSellerDisplayName/);
  });

  it("listing create prefers live profile display name", () => {
    const route = read("app/api/listings/route.ts");
    assert.match(route, /sellerDisplayNameFromProfile\(session\)/);
  });
});
