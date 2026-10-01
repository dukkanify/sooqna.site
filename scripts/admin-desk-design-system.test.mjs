/**
 * Admin desk design system: listings pattern is canonical across panels.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = path.join(root, "features/admin/components");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin desk design system CSS", () => {
  it("aliases listings classes to admin-desk-*", () => {
    const css = read("features/admin/components/admin-ops.css");
    assert.match(css, /Admin Desk Design System/);
    assert.match(css, /\.admin-listings-toolbar,\s*\n\.admin-desk-toolbar/);
    assert.match(css, /\.admin-listings-table-card,\s*\n\.admin-desk-table-card/);
    assert.match(css, /\.admin-listings-mobile-card,\s*\n\.admin-desk-mobile-card/);
    assert.match(css, /\.admin-desk\s*\{/);
  });
});

describe("admin panels adopt desk shell", () => {
  it("wallets uses full desk table + mobile pattern", () => {
    const src = read("features/admin/components/AdminWalletsPanel.tsx");
    assert.match(src, /admin-desk grid gap-4/);
    assert.match(src, /admin-desk-toolbar/);
    assert.match(src, /admin-desk-help/);
    assert.match(src, /admin-desk-filters/);
    assert.match(src, /admin-desk-table/);
    assert.match(src, /admin-desk-mobile-list/);
    assert.match(src, /admin-desk-mobile-card/);
  });

  it("ops panels use admin-desk root (not legacy gap-only shells alone)", () => {
    const required = [
      "AdminOrdersPanel.tsx",
      "AdminEscrowPanel.tsx",
      "AdminDisputesPanel.tsx",
      "AdminUsersPanel.tsx",
      "AdminNotificationsPanel.tsx",
      "AdminSettingsPanel.tsx",
      "AdminAnalyticsPanel.tsx",
      "AdminReportsPanel.tsx",
      "AdminSupportMessagesPanel.tsx",
      "AdminListingReportsPanel.tsx",
      "AdminOpsCockpit.tsx",
    ];
    for (const file of required) {
      const src = readFileSync(path.join(componentsDir, file), "utf8");
      assert.match(src, /admin-desk/, `${file} missing admin-desk`);
    }
  });

  it("does not leave orphan cream one-off backgrounds in categories board", () => {
    const css = read("features/admin/components/admin-ops.css");
    assert.doesNotMatch(css, /#f8f6f1/);
  });
});
