/**
 * Admin desks must default to real marketplace data — no localStorage sync,
 * no auto-seed on admin read, no mock paid orders in ops/analytics.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  filterRealOrders,
  isMockPaidOrder,
  isNonLiveOpsOrder,
} from "../services/admin/admin-finance-metrics.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin real-data-only contracts", () => {
  it("isMarketplaceListing excludes live catalog and showcase", () => {
    const src = read("services/listings/listing-stats.ts");
    assert.match(src, /if \(isLiveCatalogListing\(listing\)\) return false/);
    assert.match(src, /if \(isShowcaseListing\(listing\)\) return false/);
    assert.match(src, /if \(isConfirmedFixtureListing\(listing\)\) return false/);
    assert.match(src, /MARKETPLACE_LISTING_EXCLUSION_SQL/);
  });

  it("listing-stats does not auto-publish catalogs on admin stats read", () => {
    const src = read("services/listings/listing-stats.ts");
    assert.doesNotMatch(src, /ensureShowcaseCatalogPublished/);
    assert.doesNotMatch(src, /ensureLiveMarketplaceCatalogPublished/);
    assert.doesNotMatch(src, /async function ensureCatalogs/);
    assert.match(src, /isLiveCatalogListing/);
    assert.match(src, /LIVE_MARKETPLACE_LISTING_SQL/);
  });

  it("loadAdminListingRecords does not ensure catalogs", () => {
    const src = read("services/listings/listing-queries.ts");
    const fn = src.match(
      /export async function loadAdminListingRecords\([\s\S]*?\n\}/,
    )?.[0];
    assert.ok(fn, "loadAdminListingRecords exists");
    assert.doesNotMatch(fn, /ensureCatalogsForPublicRead/);
    assert.doesNotMatch(fn, /ensureShowcaseCatalogPublished/);
    assert.doesNotMatch(fn, /ensureLiveMarketplaceCatalogPublished/);
  });

  it("AdminListingsPanel loads GET-only without localStorage POST sync", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    assert.doesNotMatch(src, /getLocalListings/);
    assert.doesNotMatch(
      src,
      /body:\s*JSON\.stringify\(\{\s*listings:\s*localListings/,
    );
    assert.match(src, /adminFetch\("\/api\/admin\/listings"\)/);
    assert.match(src, /SOOQNA_LIVE_MARKETPLACE/);
  });

  it("admin listings POST rejects bulk localStorage import", () => {
    const src = read("app/api/admin/listings/route.ts");
    assert.match(src, /BULK_IMPORT_DISABLED/);
    assert.doesNotMatch(src, /upsertListing/);
  });

  it("orders and escrow APIs filter mock paid orders", () => {
    assert.match(
      read("app/api/admin/orders/route.ts"),
      /filterRealOrders/,
    );
    assert.match(
      read("app/api/admin/escrow/route.ts"),
      /filterRealOrders/,
    );
    assert.match(
      read("app/api/admin/export/route.ts"),
      /filterRealOrders/,
    );
    assert.match(
      read("app/api/admin/analytics/route.ts"),
      /computeFinanceMetrics/,
    );
    assert.match(
      read("app/api/admin/reports/route.ts"),
      /filterRealOrders/,
    );
  });

  it("filterRealOrders drops mock checkout audit rows", () => {
    const mock = {
      id: "o-mock",
      paymentStatus: "succeeded",
      auditLog: [
        {
          type: "payment_succeeded",
          message: "تم الدفع (وضع تجريبي)",
          metadata: { paymentIntentId: "mock" },
        },
      ],
      fees: { productPrice: 100, platformFee: 3, gatewayFee: 1, total: 104 },
    };
    const live = {
      id: "o-live",
      buyerId: "user-live-buyer",
      sellerId: "user-live-seller",
      paymentStatus: "succeeded",
      auditLog: [
        {
          type: "payment_succeeded",
          message: "تم الدفع",
          metadata: { paymentIntentId: "pi_live_abc" },
        },
      ],
      fees: { productPrice: 200, platformFee: 6, gatewayFee: 2, total: 208 },
    };
    assert.equal(isMockPaidOrder(mock), true);
    assert.equal(isMockPaidOrder(live), false);
    assert.deepEqual(
      filterRealOrders([mock, live]).map((o) => o.id),
      ["o-live"],
    );
  });

  it("filterRealOrders drops seed desk/finance and demo-party orders", () => {
    const seedDesk = {
      id: "order-admin-desk-demo-001",
      buyerId: "user-buyer-demo",
      sellerId: "user-seller-demo",
      paymentStatus: "succeeded",
      stripePaymentIntentId: "pi_demo_admin_desk_001",
      auditLog: [{ type: "paid", message: "تم الدفع وحجز الضمان" }],
      fees: { productPrice: 500, platformFee: 15, gatewayFee: 5, total: 520 },
    };
    const seedFinance = {
      id: "order-finance-released-001",
      buyerId: "user-buyer-demo",
      sellerId: "user-seller-demo",
      paymentStatus: "succeeded",
      stripePaymentIntentId: "pi_finance_released_001",
      auditLog: [
        {
          type: "payment_succeeded",
          message: "تم الدفع عبر Stripe",
          metadata: { paymentIntentId: "pi_finance_released_001" },
        },
      ],
      fees: { productPrice: 800, platformFee: 24, gatewayFee: 8, total: 832 },
    };
    const pendingDemo = {
      id: "ord-pending-demo-1790705652",
      buyerId: "user-buyer-demo",
      sellerId: "user-seller-demo",
      paymentStatus: "pending",
      auditLog: [{ type: "order_created", message: "تم إنشاء الطلب" }],
      fees: { productPrice: 100, platformFee: 3, gatewayFee: 1, total: 104 },
    };
    const live = {
      id: "ord-live-stripe-1",
      buyerId: "user-1789000000000-abcd",
      sellerId: "user-1789000000001-efgh",
      paymentStatus: "succeeded",
      stripePaymentIntentId: "pi_3LiveRealPayment",
      auditLog: [
        {
          type: "payment_succeeded",
          message: "تم الدفع عبر Stripe",
          metadata: { paymentIntentId: "pi_3LiveRealPayment" },
        },
      ],
      fees: { productPrice: 1200, platformFee: 36, gatewayFee: 12, total: 1248 },
    };
    for (const seed of [seedDesk, seedFinance, pendingDemo]) {
      assert.equal(isNonLiveOpsOrder(seed), true, seed.id);
    }
    assert.equal(isNonLiveOpsOrder(live), false);
    assert.deepEqual(
      filterRealOrders([seedDesk, seedFinance, pendingDemo, live]).map(
        (o) => o.id,
      ),
      ["ord-live-stripe-1"],
    );
  });

  it("dashboard queues use real orders only", () => {
    const src = read("services/admin/admin-dashboard.service.ts");
    assert.match(src, /isNonLiveOpsOrder/);
    assert.match(src, /realOrders/);
    assert.match(src, /buildDailySeries\(realOrders/);
  });

  it("stripe desk filters non-live orders and mock payment events", () => {
    const src = read("app/api/admin/stripe/route.ts");
    assert.match(src, /filterRealOrders/);
    assert.match(src, /isNonLiveOpsOrder/);
    assert.match(src, /liveEvents/);
  });

  it("dispute hydration skips non-live orders", () => {
    const src = read("services/admin/dispute-store.ts");
    assert.match(src, /isNonLiveOpsOrder/);
  });

  it("admin wallets / reports / dashboard use real wallet metrics", () => {
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
    const dashboard = read("services/admin/admin-dashboard.service.ts");
    assert.match(dashboard, /filterRealWalletAccounts/);
    assert.match(dashboard, /summarizeAdminWallets/);
    const orderService = read("services/payments/order-service.ts");
    assert.match(orderService, /source !== "mock"/);
  });
});

