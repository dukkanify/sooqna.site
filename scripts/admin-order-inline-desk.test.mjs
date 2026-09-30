/**
 * Admin orders desk: View opens in-panel modal — never buyer /orders/[id] pay journey.
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
    assert.doesNotMatch(src, /href=\{`\/orders\/\$\{order\.id\}`\}/);
    assert.doesNotMatch(src, /href=\{`\/checkout/);
  });

  it("AdminEscrowPanel View opens modal desk instead of linking to /orders/{id}", () => {
    const src = read("features/admin/components/AdminEscrowPanel.tsx");
    assert.match(src, /AdminOrderInlineDesk/);
    assert.match(src, /<Modal/);
    assert.match(src, />\s*عرض\s*</);
    assert.doesNotMatch(src, /href=\{`\/orders\/\$\{order\.id\}`\}/);
  });

  it("inline desk keeps admin actions, listing preview, and buyer notify", () => {
    const src = read("features/admin/components/AdminOrderInlineDesk.tsx");
    assert.match(src, /مكتب الطلب/);
    assert.match(src, /دون التحويل لرحلة المشتري/);
    assert.match(src, /الدفع مطلوب من المشتري/);
    assert.match(src, /إشعار المشتري بإكمال الدفع/);
    assert.match(src, /رابط معاينة مختصر للإعلان/);
    assert.match(src, /تحرير ضمان/);
    assert.match(src, /تأكيد الاسترداد/);
    assert.match(src, /سجل الأحداث/);
    assert.doesNotMatch(src, /\/orders\//);
    assert.doesNotMatch(src, /\/checkout/);
  });

  it("notify-payment admin API exists", () => {
    const src = read("app/api/admin/orders/[id]/notify-payment/route.ts");
    assert.match(src, /notifyBuyerPaymentRequired/);
    assert.match(src, /requireAdminPermission/);
  });

  it("order service notifies buyer for payment_required", () => {
    const src = read("services/payments/order-service.ts");
    assert.match(src, /export async function notifyBuyerPaymentRequired/);
    assert.match(src, /payment_required/);
    assert.match(src, /notifyBuyerPaymentRequired\(order\.id/);
  });

  it("orders page description states in-panel management", () => {
    const src = read("app/admin/orders/page.tsx");
    assert.match(src, /دون التحويل لرحلة المشتري/);
  });

  it("EN phrases cover order desk labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["مكتب الطلب"], "Order desk");
    assert.equal(phrases["استرداد إداري"], "Admin refund");
    assert.equal(
      phrases["إشعار المشتري بإكمال الدفع"],
      "Notify buyer to complete payment",
    );
    assert.equal(
      phrases["الدفع مطلوب من المشتري"],
      "Payment required from the buyer",
    );
    assert.equal(
      phrases["رابط معاينة مختصر للإعلان"],
      "Short listing preview link",
    );
  });
});
