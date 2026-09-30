/**
 * Admin finance metrics — GMV / revenue / refund / escrow definitions.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeFinanceMetrics,
  isGrossPaidOrder,
  isMockPaidOrder,
  isRefundedOrder,
  isSucceededPaidOrder,
} from "../services/admin/admin-finance-metrics.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function order(partial) {
  return {
    id: partial.id ?? "ord-1",
    listingId: "lst-1",
    listingTitle: "Test",
    buyerName: "Buyer",
    buyerEmail: "b@example.com",
    sellerId: "sel-1",
    sellerName: "Seller",
    status: partial.status ?? "paid_held_in_escrow",
    escrowStatus: partial.escrowStatus ?? "held",
    paymentStatus: partial.paymentStatus ?? "succeeded",
    fees: {
      productPrice: partial.productPrice ?? 1000,
      shippingFee: partial.shippingFee ?? 0,
      gatewayFee: partial.gatewayFee ?? 30,
      platformFee: partial.platformFee ?? 50,
      total: partial.total ?? 1080,
      currency: "AED",
    },
    createdAt: partial.createdAt ?? "2026-03-01T10:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-03-01T10:00:00.000Z",
    paidAt: partial.paidAt ?? "2026-03-01T10:00:00.000Z",
    auditLog: partial.auditLog ?? [
      {
        id: "a1",
        type: "payment_succeeded",
        message: "تم الدفع عبر Stripe",
        createdAt: "2026-03-01T10:00:00.000Z",
        metadata: { paymentIntentId: "pi_live" },
      },
    ],
  };
}

describe("admin finance metrics definitions", () => {
  it("treats mock checkout as non-reportable", () => {
    const mock = order({
      id: "mock",
      auditLog: [
        {
          id: "a1",
          type: "payment_succeeded",
          message: "تم الدفع (وضع تجريبي بدون Stripe)",
          createdAt: "2026-03-01T10:00:00.000Z",
          metadata: { paymentIntentId: "mock" },
        },
      ],
    });
    assert.equal(isMockPaidOrder(mock), true);
    assert.equal(isSucceededPaidOrder(mock), false);
    assert.equal(isGrossPaidOrder(mock), false);
  });

  it("GMV uses productPrice not buyer fees.total", () => {
    const live = order({
      productPrice: 1000,
      platformFee: 50,
      gatewayFee: 30,
      total: 1080,
    });
    const metrics = computeFinanceMetrics([live]);
    assert.equal(metrics.gmv, 1000);
    assert.equal(metrics.activeGmv, 1000);
    assert.equal(metrics.buyerCollected, 1080);
    assert.equal(metrics.platformRevenue, 50);
    assert.equal(metrics.gatewayFees, 30);
    assert.equal(metrics.netPlatformRevenue, 20);
    assert.notEqual(metrics.gmv, metrics.buyerCollected);
  });

  it("excludes mock from GMV and commissions", () => {
    const live = order({ id: "live", productPrice: 1000, platformFee: 50 });
    const mock = order({
      id: "mock",
      productPrice: 5000,
      platformFee: 250,
      total: 5300,
      auditLog: [
        {
          id: "a1",
          type: "payment_succeeded",
          message: "تم الدفع (وضع تجريبي بدون Stripe)",
          createdAt: "2026-03-01T10:00:00.000Z",
          metadata: { paymentIntentId: "mock" },
        },
      ],
    });
    const metrics = computeFinanceMetrics([live, mock]);
    assert.equal(metrics.gmv, 1000);
    assert.equal(metrics.platformRevenue, 50);
    assert.equal(metrics.succeededPaidCount, 1);
  });

  it("refund predicate covers status / escrow / payment", () => {
    assert.equal(
      isRefundedOrder(
        order({
          status: "refunded",
          escrowStatus: "refunded",
          paymentStatus: "refunded",
        }),
      ),
      true,
    );
    const refunded = order({
      status: "refunded",
      escrowStatus: "refunded",
      paymentStatus: "refunded",
      productPrice: 800,
      total: 880,
    });
    const metrics = computeFinanceMetrics([refunded]);
    assert.equal(metrics.refundedCount, 1);
    assert.equal(metrics.refundedAmount, 800);
    assert.equal(metrics.gmv, 800);
    assert.equal(metrics.activeGmv, 0);
    assert.equal(metrics.succeededPaidCount, 0);
  });

  it("separates held vs released escrow merchandise", () => {
    const held = order({
      id: "h",
      escrowStatus: "held",
      productPrice: 1000,
    });
    const released = order({
      id: "r",
      status: "released",
      escrowStatus: "released",
      productPrice: 2000,
    });
    const metrics = computeFinanceMetrics([held, released]);
    assert.equal(metrics.heldEscrowAmount, 1000);
    assert.equal(metrics.heldEscrowCount, 1);
    assert.equal(metrics.releasedEscrowAmount, 2000);
    assert.equal(metrics.releasedEscrowCount, 1);
    assert.equal(metrics.gmv, 3000);
  });

  it("respects sinceMs on paidAt for range KPIs", () => {
    const oldPaid = order({
      id: "old",
      paidAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      productPrice: 1000,
    });
    const recent = order({
      id: "new",
      paidAt: "2026-03-20T00:00:00.000Z",
      createdAt: "2026-03-20T00:00:00.000Z",
      productPrice: 400,
    });
    const sinceMs = Date.parse("2026-03-01T00:00:00.000Z");
    const metrics = computeFinanceMetrics([oldPaid, recent], { sinceMs });
    assert.equal(metrics.gmv, 400);
    assert.equal(metrics.succeededPaidCount, 1);
  });
});

describe("finance metrics wiring", () => {
  it("reports API uses computeFinanceMetrics and GMV fields", () => {
    const src = read("app/api/admin/reports/route.ts");
    assert.match(src, /computeFinanceMetrics/);
    assert.match(src, /totalVolume:\s*finance\.gmv/);
    assert.match(src, /releasedEscrowAmount:\s*finance\.releasedEscrowAmount/);
    assert.doesNotMatch(
      src,
      /paidOrders\.reduce\(\(sum,\s*o\)\s*=>\s*sum\s*\+\s*o\.fees\.total/,
    );
  });

  it("export labels GMV as merchandise not buyer total", () => {
    const src = read("app/api/admin/export/route.ts");
    assert.match(src, /computeFinanceMetrics/);
    assert.match(src, /\["gmv",\s*String\(finance\.gmv\)\]/);
    assert.match(src, /productPriceAED/);
  });

  it("dashboard financial netProfit is net platform revenue", () => {
    const src = read("services/admin/admin-dashboard.service.ts");
    assert.match(src, /computeFinanceMetrics/);
    assert.match(src, /netProfit:\s*finance\.netPlatformRevenue/);
    assert.match(src, /transactionVolume:\s*finance\.gmv/);
  });

  it("daily series volumes use productPrice and exclude mock", () => {
    const src = read("services/admin/admin-analytics.ts");
    assert.match(src, /isSucceededPaidOrder/);
    assert.match(src, /productPrice/);
    assert.doesNotMatch(
      src,
      /volume:\s*bucketOrders\.reduce\(\(sum,\s*o\)\s*=>\s*sum\s*\+\s*o\.fees\.total/,
    );
  });

  it("reports panel labels GMV and escrow release", () => {
    const src = read("features/admin/components/AdminReportsPanel.tsx");
    assert.match(src, /GMV \(قيمة البضائع\)/);
    assert.match(src, /محرّر من الضمان/);
    assert.match(src, /صافي إيراد المنصة/);
  });
});
