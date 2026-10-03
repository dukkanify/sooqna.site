/**
 * Technical store keys (user-…, live-mkt-…) must never replace human labels.
 * Run: node --test --experimental-strip-types scripts/hide-technical-ids.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  adminUserSearchHref,
  compactListingNumber,
  humanDisplayLabel,
  isTechnicalRecordId,
} from "../shared/display/technical-id.ts";
import {
  emailEventTypeLabel,
  notificationTypeLabel,
} from "../shared/display/event-type-labels.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("technical id helpers", () => {
  it("detects user and live-mkt store keys", () => {
    assert.equal(isTechnicalRecordId("user-1770123456789-ab12cd34"), true);
    assert.equal(isTechnicalRecordId("live-mkt-001"), true);
    assert.equal(isTechnicalRecordId("user-listing-003"), true);
    assert.equal(isTechnicalRecordId("local-1710000000"), true);
    assert.equal(
      isTechnicalRecordId("550e8400-e29b-41d4-a716-446655440000"),
      true,
    );
    assert.equal(isTechnicalRecordId("أحمد المنصوري"), false);
    assert.equal(isTechnicalRecordId("BMW 320i 2022"), false);
    assert.equal(isTechnicalRecordId("toyota-camry-001"), false);
  });

  it("never returns a store key as a visible label", () => {
    assert.equal(humanDisplayLabel("live-mkt-042", "إعلان"), "إعلان");
    assert.equal(
      humanDisplayLabel("user-1770123456789-ab12cd34", "مستخدم"),
      "مستخدم",
    );
    assert.equal(humanDisplayLabel("شقة في دبي مارينا", "إعلان"), "شقة في دبي مارينا");
    assert.equal(humanDisplayLabel("  ", "—"), "—");
  });

  it("compacts listing numbers without leaking prefixes", () => {
    assert.equal(compactListingNumber("live-mkt-001"), "001");
    assert.equal(compactListingNumber("user-listing-014"), "014");
    assert.equal(compactListingNumber("local-88"), "—");
    assert.equal(compactListingNumber("live-mkt-001").includes("live-mkt"), false);
    assert.equal(compactListingNumber("user-1770123456789-ab12cd34"), "—");
  });

  it("builds admin user search links from email/name, not raw ids", () => {
    const href = adminUserSearchHref("sara@sooqna.ae");
    assert.match(href, /\/admin\/users\?q=/);
    assert.match(href, /sara/);
    assert.doesNotMatch(href, /user-/);
  });

  it("extracts listing keys from public hrefs", () => {
    const src = read("shared/listings/listing-url.ts");
    assert.match(src, /export function listingKeyFromHref/);
    assert.match(src, /export function listingDetailsHref/);
  });

  it("maps notification and email types to Arabic labels", () => {
    assert.equal(notificationTypeLabel("listing_approved"), "الموافقة على إعلان");
    assert.equal(notificationTypeLabel("chat_message"), "رسالة محادثة");
    assert.equal(emailEventTypeLabel("order_paid"), "دفع طلب");
    assert.equal(notificationTypeLabel("unknown_xyz"), "إشعار");
  });
});

describe("UI never substitutes technical ids for human labels", () => {
  it("admin favorites show names/titles with links", () => {
    const src = read("features/admin/components/AdminFavoritesPanel.tsx");
    assert.match(src, /listingTitle/);
    assert.match(src, /userName/);
    assert.match(src, /listingHref/);
    assert.match(src, /userHref/);
    assert.doesNotMatch(src, /\{item\.userId\}/);
    assert.doesNotMatch(src, /item\.title \|\| item\.listingId/);
    assert.doesNotMatch(src, /\{row\.listingId\}<\/span>/);
  });

  it("admin notifications show user names and type labels, not ids", () => {
    const src = read("features/admin/components/AdminNotificationsPanel.tsx");
    assert.match(src, /userName/);
    assert.match(src, /typeLabel/);
    assert.match(src, /notificationTypeLabel/);
    assert.doesNotMatch(src, /\{item\.userId\}/);
    assert.doesNotMatch(src, /item\.type\} · \{item\.entityId\}/);
  });

  it("admin addresses and wallets hide raw user ids", () => {
    const addresses = read("features/admin/components/AdminAddressesPanel.tsx");
    assert.match(addresses, /userName/);
    assert.doesNotMatch(addresses, /\{item\.userId\}/);

    const wallets = read("features/admin/components/AdminWalletsPanel.tsx");
    assert.match(wallets, /walletLabel/);
    assert.match(wallets, /مستخدم/);
    assert.doesNotMatch(wallets, /placeholder="user-\.\.\."/);
    assert.doesNotMatch(wallets, /font-mono[\s\S]{0,120}\{wallet\.userId\}/);
  });

  it("admin listings number strip live-mkt prefixes and title links out", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(src, /compactListingNumber/);
    assert.match(src, /listingDetailsHref/);
    assert.match(src, /useLocale/);
    assert.doesNotMatch(src, /title=\{listing\.id\}/);
  });

  it("admin reports and order desk do not print seller/listing ids as labels", () => {
    const reports = read("features/admin/components/AdminListingReportsPanel.tsx");
    assert.doesNotMatch(reports, /· \$\{item\.sellerId\}/);
    assert.match(reports, /sellerHref/);
    assert.match(reports, /listingHref/);

    const desk = read("features/admin/components/AdminOrderInlineDesk.tsx");
    assert.doesNotMatch(desk, /font-mono[\s\S]{0,80}\{order\.listingId\}/);
    assert.doesNotMatch(desk, /معرّف الإعلان/);
    assert.match(desk, /order\.listingTitle/);
    assert.match(desk, /listingDetailsHref/);
  });

  it("user favorites hide technical titles", () => {
    const src = read("features/profile/components/FavoritesPanel.tsx");
    assert.match(src, /humanDisplayLabel\(item\.title/);
    assert.match(src, /listingDetailsHref/);
  });
});

describe("APIs enrich rows with display labels", () => {
  it("admin favorites/notifications/addresses resolve maps", () => {
    assert.match(
      read("app/api/admin/favorites/route.ts"),
      /resolveDisplayMaps/,
    );
    assert.match(read("app/api/admin/favorites/route.ts"), /userName/);
    assert.match(read("app/api/admin/favorites/route.ts"), /listingHref/);
    assert.match(
      read("app/api/admin/notifications/route.ts"),
      /resolveDisplayMaps/,
    );
    assert.match(
      read("app/api/admin/notifications/route.ts"),
      /notificationTypeLabel/,
    );
    assert.match(
      read("app/api/admin/addresses/route.ts"),
      /resolveDisplayMaps/,
    );
    assert.match(
      read("app/api/admin/listing-reports/route.ts"),
      /sellerHref/,
    );
    assert.match(read("app/api/favorites/route.ts"), /resolveDisplayMaps/);
  });
});
