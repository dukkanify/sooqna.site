/**
 * Buyer-paid platform fee must not drive seller available negative.
 * Run: node --test --experimental-strip-types scripts/wallet-platform-fee-ledger.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { projectWalletBalances } from "../shared/payments/wallet-balances.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function txn(type, amount, date = "2026-10-05T12:00:00.000Z") {
  return {
    id: `wtx-${type}-${amount}`,
    userId: "seller-1",
    orderId: "ord-iphone",
    type,
    amount,
    description: type,
    date,
    status: "completed",
  };
}

describe("seller wallet after live Stripe pay", () => {
  it("escrow hold of listing price is pending/held; buyer-paid fee is not available", () => {
    const balances = projectWalletBalances([
      txn("escrow_hold", 1500),
      txn("platform_fee", -450),
    ]);
    assert.deepEqual(balances, {
      availableBalance: 0,
      pendingBalance: 1500,
      heldInEscrow: 1500,
    });
  });

  it("release moves product price to available without fee leftover", () => {
    const balances = projectWalletBalances([
      txn("escrow_hold", 1500, "2026-10-05T12:00:00.000Z"),
      txn("platform_fee", -450, "2026-10-05T12:00:01.000Z"),
      txn("escrow_release", 1500, "2026-10-06T12:00:00.000Z"),
    ]);
    assert.deepEqual(balances, {
      availableBalance: 1500,
      pendingBalance: 0,
      heldInEscrow: 0,
    });
  });

  it("paid orders do not write platform_fee onto the seller ledger", () => {
    const src = readFileSync(
      path.join(root, "services/payments/order-service.ts"),
      "utf8",
    );
    assert.doesNotMatch(src, /type: "platform_fee"/);
    assert.match(src, /recordPaymentTreasury/);
    assert.match(src, /type: "escrow_hold"/);
  });

  it("seller wallet hides historic platform_fee rows from activity", () => {
    const src = readFileSync(
      path.join(root, "services/walletService.ts"),
      "utf8",
    );
    assert.match(src, /txn.type !== "platform_fee"/);
  });
});

describe("seller Connect copy", () => {
  it("does not send sellers to the Stripe Connect dashboard signup URL", () => {
    const src = readFileSync(
      path.join(root, "services/payments/stripe-connect.service.ts"),
      "utf8",
    );
    assert.match(src, /sellerConnectPublicMessage/);
    assert.match(src, /signed up for Connect/);
    assert.match(
      readFileSync(
        path.join(root, "app/api/seller/stripe/connect/route.ts"),
        "utf8",
      ),
      /sellerConnectPublicMessage/,
    );
  });
});
