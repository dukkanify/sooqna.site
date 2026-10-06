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
  it("maps Stripe Connect signup errors to Arabic and never returns the dashboard URL", async () => {
    const { sellerConnectPublicMessage } = await import(
      "../services/payments/stripe-connect-errors.ts"
    );
    const message = sellerConnectPublicMessage(
      new Error(
        "You can only create new accounts if you've signed up for Connect, which you can do at https://dashboard.stripe.com/connect",
      ),
    );
    assert.equal(message.includes("dashboard.stripe.com"), false);
    assert.equal(message.includes("You can only"), false);
    assert.match(message, /الاستلام البنكي/);

    const fromRaw = sellerConnectPublicMessage({
      raw: {
        message:
          "You can only create new accounts if you've signed up for Connect, which you can do at https://dashboard.stripe.com/connect",
      },
    });
    assert.equal(fromRaw.includes("dashboard.stripe.com"), false);
    assert.match(fromRaw, /الاستلام البنكي/);
  });

  it("seller wallet hides onboard when platform Connect is off", () => {
    const card = readFileSync(
      path.join(root, "features/wallet/components/SellerPayoutConnectCard.tsx"),
      "utf8",
    );
    assert.match(card, /platformConnectEnabled/);
    assert.match(card, /connectAvailable/);
    assert.doesNotMatch(
      readFileSync(
        path.join(root, "app/api/seller/stripe/connect/route.ts"),
        "utf8",
      ),
      /error: message/,
    );
    const service = readFileSync(
      path.join(root, "services/payments/stripe-connect.service.ts"),
      "utf8",
    );
    assert.match(service, /ENABLE_STRIPE_CONNECT_PAYOUTS/);
    assert.match(service, /getStoredConnectSignupEnabled/);
  });
});
