import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin wallet real data", () => {
  it("wallet metrics filter demo users and mock-order ledger rows", () => {
    const src = read("services/admin/admin-wallet-metrics.ts");
    assert.match(src, /export function filterRealWalletAccounts/);
    assert.match(src, /export function projectRealWalletBalances/);
    assert.match(src, /export async function loadAdminWalletsPayload/);
    assert.match(src, /isDemoWalletUserId/);
    assert.match(src, /BLOCKED_USER_IDS/);
    assert.match(src, /@sooqna\.demo/);
    assert.match(src, /isNonLiveOpsOrder/);
  });

  it("admin desks load filtered wallet payload", () => {
    assert.match(
      read("app/api/admin/wallets/route.ts"),
      /loadAdminWalletsPayload/,
    );
    assert.match(
      read("app/api/admin/reports/route.ts"),
      /loadAdminWalletsPayload/,
    );
    assert.match(
      read("app/api/admin/analytics/route.ts"),
      /loadAdminWalletsPayload/,
    );
    assert.match(
      read("services/admin/admin-dashboard.service.ts"),
      /filterRealWalletAccounts/,
    );
  });

  it("mock checkout does not write seller wallet ledger", () => {
    const src = read("services/payments/order-service.ts");
    assert.match(src, /source !== "mock"/);
    assert.match(src, /isMockPaidOrder\(order\)/);
    assert.doesNotMatch(src, /type: "platform_fee"/);
  });

  it("wallets panel surfaces names and real-data copy", () => {
    const panel = read("features/admin/components/AdminWalletsPanel.tsx");
    assert.match(panel, /fullName/);
    assert.match(panel, /محفظة حقيقية/);
    assert.match(panel, /بدون حسابات تجريبية/);
    assert.match(panel, /visibleSummary/);
  });
});
