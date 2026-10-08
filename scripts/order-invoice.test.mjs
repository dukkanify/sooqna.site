import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buyerFacingInvoiceFees,
  calculateOrderFees,
  DEFAULT_ORDER_FEE_RATES,
} from "../shared/payments/order-fees.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("order invoice", () => {
  it("buyerFacingInvoiceFees never exposes a separate gateway line", () => {
    const legacy = buyerFacingInvoiceFees({
      productPrice: 2100,
      shippingFee: 15,
      platformFee: 53,
      gatewayFee: 62,
      total: 2230,
    });
    assert.equal(legacy.platformFee, 115);
    assert.equal(legacy.total, 2230);
    assert.equal(
      legacy.productPrice + legacy.shippingFee + legacy.platformFee,
      legacy.total,
    );

    const current = buyerFacingInvoiceFees(
      calculateOrderFees(1000, 15, DEFAULT_ORDER_FEE_RATES),
    );
    assert.equal(current.platformFee, 25);
    assert.equal(current.total, 1040);
    assert.equal(
      current.productPrice + current.shippingFee + current.platformFee,
      current.total,
    );
  });

  it("invoice builder never prints gateway fee and uses buyer-facing fees", () => {
    const src = read("services/email/order-invoice.ts");
    assert.match(src, /export function invoiceNumberForOrder/);
    assert.match(src, /export function buildOrderInvoiceHtml/);
    assert.match(src, /buyerFacingInvoiceFees/);
    assert.match(src, /إيصال رسمي/);
    assert.match(src, /Official receipt/);
    assert.match(src, /رسوم الخدمة/);
    assert.match(src, /Service fee/);
    assert.match(src, /INV-/);
    assert.doesNotMatch(src, /رسوم البوابة/);
    assert.doesNotMatch(src, /Gateway fee/);
    assert.doesNotMatch(src, /isGatewayPassedThrough/);
  });

  it("send + paid paths attach invoice to purchase emails", () => {
    const send = read("services/email/send-order-invoice.ts");
    const paid = read("services/email/notification-emails.ts");
    const guest = read("services/email/order-email.service.ts");
    const route = read("app/api/admin/orders/[id]/send-invoice/route.ts");
    const types = read("services/email/email-log-store.ts");
    assert.match(send, /export async function sendOrderInvoiceEmail/);
    assert.match(send, /type: "order_invoice"/);
    assert.match(paid, /invoiceBlockForPaidEmail/);
    assert.match(guest, /invoiceBlockForPaidEmail/);
    assert.match(route, /sendOrderInvoiceEmail/);
    assert.match(types, /"order_invoice"/);
  });

  it("admin send-invoice never reports success when mail delivery failed", () => {
    const route = read("app/api/admin/orders/[id]/send-invoice/route.ts");
    const orders = read("features/admin/components/AdminOrdersPanel.tsx");
    const escrow = read("features/admin/components/AdminEscrowPanel.tsx");
    assert.match(route, /status === "failed"/);
    assert.match(route, /EMAIL_FAILED/);
    assert.match(route, /status:\s*502/);
    assert.match(orders, /status === "sent" \|\| status === "skipped"/);
    assert.match(orders, /EMAIL_FAILED/);
    assert.match(escrow, /status === "sent" \|\| status === "skipped"/);
    assert.match(escrow, /EMAIL_FAILED/);
    // Success toast only after an explicit sent/skipped delivery status.
    assert.match(
      orders,
      /if \(res\.ok && \(status === "sent" \|\| status === "skipped"\)\)/,
    );
    assert.match(
      escrow,
      /if \(res\.ok && \(status === "sent" \|\| status === "skipped"\)\)/,
    );
  });
});
