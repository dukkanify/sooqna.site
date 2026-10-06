/**
 * Admin orders desk: View opens in-panel modal — never buyer /orders/[id] pay journey.
 * Includes professional invoice preview + send.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin order inline desk", () => {
  it("AdminOrdersPanel View opens modal desk instead of linking to /orders/{id}", () => {
    const src = read("features/admin/components/AdminOrdersPanel.tsx");
    assert.match(src, /AdminOrderInlineDesk/);
    assert.match(src, /<Modal/);
    assert.match(src, />\s*عرض\s*</);
    assert.match(src, /notify-payment/);
    assert.match(src, /send-invoice/);
    assert.match(src, /onSendInvoice/);
    assert.doesNotMatch(src, /href=\{`\/orders\/\$\{order\.id\}`\}/);
    assert.doesNotMatch(src, /href=\{`\/checkout/);
  });

  it("AdminEscrowPanel View opens modal desk instead of linking to /orders/{id}", () => {
    const src = read("features/admin/components/AdminEscrowPanel.tsx");
    assert.match(src, /AdminOrderInlineDesk/);
    assert.match(src, /<Modal/);
    assert.match(src, />\s*عرض\s*</);
    assert.match(src, /send-invoice/);
    assert.doesNotMatch(src, /href=\{`\/orders\/\$\{order\.id\}`\}/);
  });

  it("inline desk is organized and surfaces invoice actions", () => {
    const src = read("features/admin/components/AdminOrderInlineDesk.tsx");
    assert.match(src, /مكتب الطلب|ملخص إداري للطلب/);
    assert.match(src, /لن يتم تحويلك لصفحة الدفع/);
    assert.match(src, /بانتظار دفع المشتري/);
    assert.match(src, /تنبيه المشتري لإكمال الدفع/);
    assert.match(src, /OrderInvoicePreview/);
    assert.match(src, /تحرير الضمان/);
    assert.match(src, /تأكيد الاسترداد/);
    assert.match(src, /سجل الأحداث/);
    assert.doesNotMatch(src, /\/orders\//);
    assert.doesNotMatch(src, /\/checkout/);
  });

  it("invoice preview supports view/print and send", () => {
    const src = read("features/admin/components/OrderInvoicePreview.tsx");
    assert.match(src, /عرض \/ طباعة/);
    assert.match(src, /إرسال للمشتري/);
    assert.match(src, /buildOrderInvoiceHtml/);
    assert.match(src, /createObjectURL/);
    assert.match(src, /آخر إرسال/);
  });

  it("inline desk allows sending invoices to guest buyer email", () => {
    const src = read("features/admin/components/AdminOrderInlineDesk.tsx");
    assert.match(src, /guestEmail/);
    assert.match(src, /buyerEmail \|\| order\.guestEmail/);
  });

  it("notify-payment and send-invoice admin APIs exist", () => {
    const notify = read("app/api/admin/orders/[id]/notify-payment/route.ts");
    const invoice = read("app/api/admin/orders/[id]/send-invoice/route.ts");
    assert.match(notify, /notifyBuyerPaymentRequired/);
    assert.match(notify, /requireAdminPermission/);
    assert.match(invoice, /sendOrderInvoiceEmail/);
    assert.match(invoice, /requireAdminPermission/);
  });

  it("paid emails embed professional invoice", () => {
    const paid = read("services/email/notification-emails.ts");
    const guest = read("services/email/order-email.service.ts");
    const invoice = read("services/email/order-invoice.ts");
    assert.match(paid, /invoiceBlockForPaidEmail/);
    assert.match(guest, /invoiceBlockForPaidEmail/);
    assert.match(invoice, /فاتورة ضريبية|Tax invoice/);
    assert.match(invoice, /invoiceNumberForOrder/);
  });

  it("order service notifies buyer for payment_required", () => {
    const src = read("services/payments/order-service.ts");
    assert.match(src, /export async function notifyBuyerPaymentRequired/);
    assert.match(src, /payment_required/);
    assert.match(src, /notifyBuyerPaymentRequired\(order\.id/);
  });

  it("orders page description mentions invoices", () => {
    const src = read("app/admin/orders/page.tsx");
    assert.match(src, /الفواتير|الفاتورة/);
  });

  it("escrow API returns held, released, and refunded history", () => {
    const src = read("app/api/admin/escrow/route.ts");
    assert.match(src, /escrowStatus === "held"/);
    assert.match(src, /escrowStatus === "released"/);
    assert.match(src, /escrowStatus === "refunded"/);
  });

  it("orders desk can filter released and refunded escrow stages", () => {
    const src = read("features/admin/components/AdminOrdersPanel.tsx");
    assert.match(src, /value: "released"/);
    assert.match(src, /value: "refunded"/);
    assert.match(src, /محرَّر/);
    assert.match(src, /مسترد/);
  });

  it("EN phrases cover order desk + invoice labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["مكتب الطلب"], "Order desk");
    assert.equal(phrases["استرداد إداري"], "Admin refund");
    assert.equal(phrases["الفاتورة"], "Invoice");
    assert.equal(phrases["إرسال للمشتري"], "Send to buyer");
    assert.equal(phrases["عرض / طباعة"], "View / print");
    assert.equal(
      phrases["تنبيه المشتري لإكمال الدفع"],
      "Remind buyer to complete payment",
    );
    assert.equal(phrases["بانتظار دفع المشتري"], "Awaiting buyer payment");
  });
});
