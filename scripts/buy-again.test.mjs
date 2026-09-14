/**
 * Buy Again / repurchase eligibility — decision matrix + source wiring.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

const PURCHASABLE = new Set([
  "mobiles",
  "electronics",
  "furniture",
  "fashion",
  "kids",
  "sports",
  "books",
  "food",
]);

function listingMeetsPurchaseRules(listing) {
  if (!listing) return false;
  if (!PURCHASABLE.has(listing.categoryId)) return false;
  if (listing.status && listing.status !== "active") return false;
  if (!Number.isFinite(listing.price) || listing.price <= 0) return false;
  return true;
}

function resolveBuyAgainAction({
  order,
  viewerId,
  listing,
  listingDeleted,
  sellerCanSell,
  checkoutConfigured,
  checkoutSessionOpen = null,
  pendingOrderIdForListing,
}) {
  if (!viewerId || !order.buyerId || order.buyerId !== viewerId) {
    return { kind: "none" };
  }
  if (order.status === "pending_payment") {
    const hasSession = Boolean(order.stripeCheckoutSessionId);
    const failed = order.paymentStatus === "failed";
    const kind =
      failed || checkoutSessionOpen === false || !hasSession
        ? "retry_payment"
        : "complete_payment";
    return { kind, resumeOrderId: order.id };
  }
  if (order.status === "disputed") return { kind: "none" };
  const completed = new Set([
    "paid_held_in_escrow",
    "delivered",
    "confirmed",
    "released",
  ]);
  const repurchase = new Set(["refunded", "cancelled"]);
  if (!completed.has(order.status) && !repurchase.has(order.status)) {
    return { kind: "none" };
  }
  if (pendingOrderIdForListing && pendingOrderIdForListing !== order.id) {
    return { kind: "complete_payment", resumeOrderId: pendingOrderIdForListing };
  }
  if (!listing || listingDeleted) return { kind: "listing_gone" };
  if (listing.status && listing.status !== "active") return { kind: "listing_gone" };
  if (!sellerCanSell) return { kind: "seller_inactive" };
  if (!(checkoutConfigured && listingMeetsPurchaseRules(listing))) {
    return { kind: "unavailable" };
  }
  return {
    kind: repurchase.has(order.status) ? "repurchase" : "buy_again",
    currentPrice: listing.price,
    previousPrice: order.fees.productPrice,
    priceChanged: listing.price !== order.fees.productPrice,
  };
}

function electronics(overrides = {}) {
  return {
    id: "listing-phone",
    categoryId: "mobiles",
    price: 120,
    status: "active",
    ...overrides,
  };
}

function order(overrides = {}) {
  return {
    id: "ord-1",
    status: "released",
    paymentStatus: "succeeded",
    buyerId: "buyer-1",
    fees: { productPrice: 101 },
    stripeCheckoutSessionId: undefined,
    ...overrides,
  };
}

const buyer = {
  viewerId: "buyer-1",
  sellerCanSell: true,
  checkoutConfigured: true,
};

test("CASE 1: completed order + product active → Buy Again", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({ status: "released" }),
    listing: electronics(),
  });
  assert.equal(decision.kind, "buy_again");
  assert.equal(decision.currentPrice, 120);
  assert.equal(decision.priceChanged, true);
});

test("CASE 2: completed order + product unpublished → no Buy Again", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({ status: "released" }),
    listing: electronics({ status: "expired" }),
  });
  assert.equal(decision.kind, "listing_gone");
});

test("CASE 3: pending payment → complete payment, never Buy Again", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({
      status: "pending_payment",
      paymentStatus: "processing",
      stripeCheckoutSessionId: "cs_test_open",
    }),
    listing: electronics(),
    checkoutSessionOpen: true,
  });
  assert.equal(decision.kind, "complete_payment");
  assert.equal(decision.resumeOrderId, "ord-1");
});

test("pending payment with expired session → retry payment", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({
      status: "pending_payment",
      paymentStatus: "pending",
      stripeCheckoutSessionId: "cs_test_expired",
    }),
    listing: electronics(),
    checkoutSessionOpen: false,
  });
  assert.equal(decision.kind, "retry_payment");
});

test("CASE 4: cancelled order + product available → repurchase", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({ status: "cancelled", paymentStatus: "failed" }),
    listing: electronics(),
  });
  assert.equal(decision.kind, "repurchase");
});

test("CASE 5: refunded order + product available → repurchase", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({ status: "refunded", paymentStatus: "refunded" }),
    listing: electronics(),
  });
  assert.equal(decision.kind, "repurchase");
});

test("CASE 6: listing deleted → Buy Again unavailable", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({ status: "released" }),
    listing: null,
    listingDeleted: true,
  });
  assert.equal(decision.kind, "listing_gone");
});

test("CASE 7: price changed uses current listing price", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    order: order({ status: "released" }),
    listing: electronics({ price: 120 }),
  });
  assert.equal(decision.currentPrice, 120);
  assert.equal(decision.previousPrice, 101);
});

test("CASE 9: different user cannot repurchase", () => {
  const decision = resolveBuyAgainAction({
    ...buyer,
    viewerId: "intruder",
    order: order({ status: "released" }),
    listing: electronics(),
  });
  assert.equal(decision.kind, "none");
});

test("cars / real-estate / jobs / services are not Buy Again", () => {
  for (const categoryId of ["cars", "real-estate", "jobs", "services"]) {
    const decision = resolveBuyAgainAction({
      ...buyer,
      order: order({ status: "released" }),
      listing: electronics({ categoryId }),
    });
    assert.equal(decision.kind, "unavailable", categoryId);
  }
});

test("seller inactive and open pending for same listing are gated", () => {
  assert.equal(
    resolveBuyAgainAction({
      ...buyer,
      sellerCanSell: false,
      order: order({ status: "released" }),
      listing: electronics(),
    }).kind,
    "seller_inactive",
  );
  assert.equal(
    resolveBuyAgainAction({
      ...buyer,
      pendingOrderIdForListing: "ord-pending",
      order: order({ status: "released" }),
      listing: electronics(),
    }).resumeOrderId,
    "ord-pending",
  );
});

test("production Buy Again wiring stays on Sooqna purchase eligibility", () => {
  const action = read("services/payments/buy-again-action.ts");
  const service = read("services/payments/buy-again.service.ts");
  const route = read("app/api/orders/[id]/buy-again/route.ts");
  const ui = read("features/orders/components/OrderRepurchaseActions.tsx");
  const checkout = read("features/checkout/components/CheckoutWizard.tsx");
  const eligibility = read("shared/listings/purchase-eligibility.ts");

  assert.match(eligibility, /isPurchasableListing/);
  assert.match(action, /listingMeetsPurchaseRules/);
  assert.match(action, /شراء مرة أخرى/);
  assert.match(action, /إكمال الدفع/);
  assert.match(action, /إعادة محاولة الدفع/);
  assert.match(action, /إعادة الشراء/);
  assert.match(action, /المنتج غير متوفر حالياً/);
  assert.match(action, /هذا المنتج لم يعد متاحاً للشراء/);
  assert.match(service, /isPurchasableListing/);
  assert.match(service, /requireSessionUser|buyerId !== input.buyerId|FORBIDDEN/);
  assert.match(service, /withBuyAgainLock|buyAgainLocks/);
  assert.match(route, /requireSessionUser/);
  assert.match(route, /Idempotency-Key|idempotency-key/);
  assert.match(ui, /شراء مرة أخرى|decision.label/);
  assert.match(checkout, /repurchasedFromOrderId/);
  assert.match(read("types/domain/order.ts"), /repurchasedFromOrderId/);
});
