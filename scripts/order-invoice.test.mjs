import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("order invoice", () => {
  it("invoice builder exposes bilingual professional receipt markup", () => {
    const src = read("services/email/order-invoice.ts");
    assert.match(src, /export function invoiceNumberForOrder/);
    assert.match(src, /export function buildOrderInvoiceHtml/);
    assert.match(src, /فاتورة ضريبية/);
    assert.match(src, /Tax invoice/);
    assert.match(src, /INV-/);
    assert.match(src, /platformFee|رسوم المنصة/);
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
});
