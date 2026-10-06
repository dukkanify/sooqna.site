/**
 * Checkout totals + delivery-phone snapshot.
 * Run: node --test --experimental-strip-types scripts/checkout-totals-phone.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  calculateOrderFees,
  DEFAULT_ORDER_FEE_RATES,
  isGatewayPassedThrough,
  resolveOrderFeeRates,
  stripeAmountFils,
} from "../shared/payments/order-fees.ts";
import {
  checkoutDeliveryFingerprint,
  snapshotDeliveryAddress,
} from "../services/payments/checkout-delivery.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("calculateOrderFees", () => {
  it("charges listing + shipping + platform percent; gateway is absorbed", () => {
    const fees = calculateOrderFees(1000, 15, DEFAULT_ORDER_FEE_RATES);
    assert.equal(fees.productPrice, 1000);
    assert.equal(fees.shippingFee, 15);
    assert.equal(fees.platformFee, 25);
    assert.equal(fees.gatewayFee, 30);
    assert.equal(fees.total, 1040);
    assert.equal(stripeAmountFils(fees.total), 104000);
    assert.equal(isGatewayPassedThrough(fees), false);
  });

  it("rounds listing price before fees (UI/server parity)", () => {
    const fees = calculateOrderFees(99.6, 15);
    assert.equal(fees.productPrice, 100);
    assert.equal(fees.platformFee, 3);
    assert.equal(fees.total, 100 + 15 + 3);
  });

  it("uses live admin rates when provided", () => {
    const fees = calculateOrderFees(200, 0, {
      platformFeePercent: 5,
      gatewayFeePercent: 0,
      gatewayFeeFixed: 2,
    });
    assert.equal(fees.platformFee, 10);
    assert.equal(fees.gatewayFee, 2);
    assert.equal(fees.total, 210);
  });

  it("matches a 30% admin-panel rate on a 3000 AED listing", () => {
    const fees = calculateOrderFees(3000, 15, {
      platformFeePercent: 30,
      gatewayFeePercent: 2.9,
      gatewayFeeFixed: 1,
    });
    assert.equal(fees.platformFee, 900);
    assert.equal(fees.gatewayFee, 88);
    assert.equal(fees.total, 3915);
    assert.equal(isGatewayPassedThrough({ ...fees, total: 4003 }), true);
  });

  it("does not fill factory 2.5% when admin rates are missing", () => {
    assert.equal(resolveOrderFeeRates(null), null);
    assert.equal(resolveOrderFeeRates({ platformFeePercent: 30 }), null);
    assert.deepEqual(
      resolveOrderFeeRates({
        platformFeePercent: 30,
        gatewayFeePercent: 2.9,
        gatewayFeeFixed: 1,
      }),
      {
        platformFeePercent: 30,
        gatewayFeePercent: 2.9,
        gatewayFeeFixed: 1,
      },
    );
  });
});

describe("delivery phone snapshot", () => {
  it("prefers the edited checkout phone over a saved-address number", () => {
    const snapshot = snapshotDeliveryAddress({
      buyerName: "Ahmed",
      buyerPhone: "+971501119999",
      deliveryAddress: {
        fullName: "Ahmed",
        phone: "+971501119999",
        emirate: "دبي",
        city: "دبي",
        area: "المارينا",
        street: "شارع 1",
      },
      savedAddress: {
        fullName: "Ahmed",
        phone: "+971501110000",
        emirate: "دبي",
        city: "دبي",
        area: "المارينا",
        street: "شارع 1",
      },
    });
    assert.equal(snapshot?.phone, "+971501119999");
  });

  it("falls back to buyer phone when snapshoting a saved address without overlay", () => {
    const snapshot = snapshotDeliveryAddress({
      buyerName: "Ahmed",
      buyerPhone: "+971501119999",
      savedAddress: {
        fullName: "Ahmed",
        phone: "+971501110000",
        emirate: "دبي",
        city: "دبي",
        area: "المارينا",
        street: "شارع 1",
      },
    });
    assert.equal(snapshot?.phone, "+971501119999");
    const changed = checkoutDeliveryFingerprint({
      feesTotal: 1070,
      shippingMethod: "standard",
      snapshot,
    });
    const original = checkoutDeliveryFingerprint({
      feesTotal: 1070,
      shippingMethod: "standard",
      snapshot: { ...snapshot, phone: "+971501110000" },
    });
    assert.notEqual(changed, original);
  });
});

describe("checkout wiring", () => {
  it("wizard uses admin-panel rates, not a 2.5% first paint", () => {
    const wizard = read("features/checkout/components/CheckoutWizard.tsx");
    const payload = read("features/checkout/utils/checkout-validation.ts");
    assert.match(wizard, /buildCheckoutDeliveryPayload/);
    assert.match(payload, /phone: buyer\.phone \|\| selectedAddress\.phone/);
    assert.match(wizard, /normalized\.phone \|\| sessionUser\?\.phone/);
    assert.doesNotMatch(
      wizard,
      /phone:\s*sessionUser\?\.phone\?\.trim\(\) \|\| normalized\.phone/,
    );
    assert.match(wizard, /calculateOrderFees/);
    assert.match(wizard, /resolveOrderFeeRates/);
    assert.match(wizard, /cache:\s*"no-store"/);
    assert.match(wizard, /رسوم المنصة \(\{feeRates\.platformFeePercent\}%\)/);
    assert.match(wizard, /تكلفة بوابة الدفع ضمن هذه النسبة/);
    assert.doesNotMatch(
      wizard,
      /رسوم الدفع \(\{feeRates\.gatewayFeePercent\}%\)/,
    );
    assert.doesNotMatch(wizard, /DEFAULT_ORDER_FEE_RATES/);
    assert.doesNotMatch(
      wizard,
      /useState<OrderFeeRates>\(DEFAULT_ORDER_FEE_RATES\)/,
    );
    assert.match(wizard, /هاتف التوصيل/);
    assert.match(wizard, /UaePhoneInput/);
  });

  it("server hydrates settings before fees and snapshots delivery phone", () => {
    const service = read("services/payments/order-service.ts");
    assert.match(service, /calculateOrderFeesFromSettings/);
    assert.match(service, /snapshotDeliveryAddress/);
    assert.match(service, /checkout_details_updated/);
    assert.match(service, /amount_total/);
  });

  it("site-settings exposes live fee rates without caching defaults", () => {
    const settings = read("app/api/site-settings/route.ts");
    assert.match(settings, /platformFeePercent: settings\.platformFeePercent/);
    assert.match(settings, /gatewayFeePercent: settings\.gatewayFeePercent/);
    assert.match(settings, /gatewayFeeFixed: settings\.gatewayFeeFixed/);
    assert.match(settings, /getAdminSettings\(\{ fresh: true \}\)/);
    assert.match(settings, /Cache-Control": "no-store"/);
  });

  it("checkout page hydrates wizard from current admin settings", () => {
    const page = read("app/checkout/page.tsx");
    const fees = read("services/payments/fee-calculator.ts");
    const store = read("services/admin/admin-settings-store.ts");
    const admin = read("features/admin/components/AdminSettingsPanel.tsx");
    assert.match(page, /getAdminSettings\(\{ fresh: true \}\)/);
    assert.match(page, /feeRates=\{feeRates\}/);
    assert.match(fees, /getAdminSettings\(\{ fresh: true \}\)/);
    assert.match(store, /options\?\.fresh/);
    assert.match(admin, /نسبة المنصة هي التي يراها المشتري/);
  });

  it("buyer order page shows itemized fees and delivery snapshot phone", () => {
    const detail = read("features/orders/components/OrderDetailContent.tsx");
    assert.match(detail, /isGatewayPassedThrough/);
    assert.match(detail, /deliveryAddressSnapshot/);
    assert.match(detail, /order\.deliveryAddressSnapshot\.phone/);
  });
});
