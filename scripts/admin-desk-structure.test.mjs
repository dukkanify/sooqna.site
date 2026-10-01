/**
 * Admin desk structure: every data desk uses table + mobile cards (listings pattern).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "features/admin/components");

function read(name) {
  return readFileSync(path.join(dir, name), "utf8");
}

const dataDesks = [
  "AdminUsersPanel.tsx",
  "AdminWalletsPanel.tsx",
  "AdminOrdersPanel.tsx",
  "AdminEscrowPanel.tsx",
  "AdminDisputesPanel.tsx",
  "AdminNotificationsPanel.tsx",
  "AdminAddressesPanel.tsx",
  "AdminFavoritesPanel.tsx",
  "AdminAuditPanel.tsx",
  "AdminActivitiesPanel.tsx",
  "AdminJobApplicationsPanel.tsx",
  "AdminViewingBookingsPanel.tsx",
  "AdminQuoteRequestsPanel.tsx",
  "AdminSupportMessagesPanel.tsx",
  "AdminListingReportsPanel.tsx",
  "AdminCategoriesPanel.tsx",
  "AdminLocationsPanel.tsx",
];

describe("admin desk structure parity with listings", () => {
  for (const file of dataDesks) {
    it(`${file} uses desk table + mobile list (not queue/boxes grid)`, () => {
      const src = read(file);
      assert.match(src, /admin-desk-table/, `${file} missing table`);
      assert.match(src, /admin-desk-mobile-list/, `${file} missing mobile list`);
      assert.match(src, /admin-desk-mobile-card/, `${file} missing mobile card`);
      assert.doesNotMatch(src, /admin-ops__queue/, `${file} still has queue`);
      assert.doesNotMatch(src, /admin-boxes__grid/, `${file} still has boxes grid`);
      assert.doesNotMatch(src, /admin-users__list/, `${file} still has users card list`);
    });
  }

  it("listings still owns the canonical table pattern", () => {
    const src = read("AdminListingsPanel.tsx");
    assert.match(src, /admin-listings-table|admin-desk-table/);
    assert.match(src, /admin-listings-mobile-list|admin-desk-mobile-list/);
  });
});
