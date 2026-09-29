/**
 * Admin orders desk: manage orders in-panel without redirect to /orders/[id].
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
  it("AdminOrdersPanel opens مكتب الطلب instead of linking to /orders/{id}", () => {
    const src = read("features/admin/components/AdminOrdersPanel.tsx");
    assert.match(src, /AdminOrderInlineDesk/);
    assert.match(src, /مكتب الطلب/);
    assert.doesNotMatch(src, /href=\{`\/orders\/\$\{order\.id\}`\}/);
    assert.doesNotMatch(src, />\s*عرض\s*</);
  });

  it("AdminEscrowPanel opens مكتب الطلب instead of linking to /orders/{id}", () => {
    const src = read("features/admin/components/AdminEscrowPanel.tsx");
    assert.match(src, /AdminOrderInlineDesk/);
    assert.match(src, /مكتب الطلب/);
    assert.doesNotMatch(src, /href=\{`\/orders\/\$\{order\.id\}`\}/);
  });

  it("inline desk keeps admin actions and rejects site payment journey copy", () => {
    const src = read("features/admin/components/AdminOrderInlineDesk.tsx");
    assert.match(src, /مكتب الطلب/);
    assert.match(src, /دون التحويل لرحلة المشتري/);
    assert.match(src, /تحرير ضمان/);
    assert.match(src, /تأكيد الاسترداد/);
    assert.match(src, /سجل الأحداث/);
    assert.doesNotMatch(src, /\/orders\//);
  });

  it("orders page description states in-panel management", () => {
    const src = read("app/admin/orders/page.tsx");
    assert.match(src, /دون التحويل لرحلة المشتري/);
  });

  it("EN phrases cover order desk labels", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["مكتب الطلب"], "Order desk");
    assert.equal(phrases["استرداد إداري"], "Admin refund");
  });
});
