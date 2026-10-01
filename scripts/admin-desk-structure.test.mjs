/**
 * Admin desk structure: listings pattern is required on every data desk.
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
  "AdminListingsPanel.tsx",
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
  "AdminStripePanel.tsx",
  "AdminAnalyticsPanel.tsx",
  "AdminReportsPanel.tsx",
  "AdminOpsCockpit.tsx",
];

const formDesks = [
  "AdminSettingsPanel.tsx",
  "AdminCategoryFormsPanel.tsx",
  "AdminVehicleCatalogPanel.tsx",
];

describe("admin desk structure parity with listings", () => {
  for (const file of dataDesks) {
    it(`${file} uses desk table + mobile list (not legacy grids)`, () => {
      const src = read(file);
      assert.match(src, /admin-desk|admin-listings-/);
      assert.match(src, /admin-desk-table|admin-listings-table/);
      assert.match(src, /admin-desk-mobile-list|admin-listings-mobile-list/);
      assert.doesNotMatch(src, /admin-ops__queue/);
      assert.doesNotMatch(src, /admin-boxes__grid/);
      assert.doesNotMatch(src, /admin-users__list/);
      assert.doesNotMatch(src, /admin-categories__list/);
      assert.doesNotMatch(src, /admin-dash__queue-grid/);
      assert.doesNotMatch(src, /admin-dash__risk-grid/);
      assert.doesNotMatch(src, /admin-dash__activity/);
    });
  }

  for (const file of formDesks) {
    it(`${file} uses desk shell + help cards (no legacy queues)`, () => {
      const src = read(file);
      assert.match(src, /admin-desk/);
      assert.match(src, /admin-desk-help/);
      assert.doesNotMatch(src, /admin-ops__queue/);
      assert.doesNotMatch(src, /admin-boxes__grid/);
      assert.doesNotMatch(src, /admin-ops__panel/);
    });
  }
});
