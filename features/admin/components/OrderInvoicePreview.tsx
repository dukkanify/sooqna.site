"use client";

import type { Order } from "@/types";
import {
  buildOrderInvoiceHtml,
  invoiceNumberForOrder,
} from "@/services/email/order-invoice";
import { Button } from "@/shared/ui/Button";

type OrderInvoicePreviewProps = {
  canSend: boolean;
  locale: "ar" | "en";
  onSend?: () => void;
  order: Order;
  sendBusy?: boolean;
};

export function OrderInvoicePreview({
  canSend,
  locale,
  onSend,
  order,
  sendBusy = false,
}: OrderInvoicePreviewProps) {
  const invoiceNo = invoiceNumberForOrder(order);
  const html = buildOrderInvoiceHtml(order, locale);
  const paid =
    order.paymentStatus === "succeeded" || Boolean(order.paidAt);

  return (
    <div className="grid gap-3 rounded-[var(--radius-xl)] border border-border bg-surface px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            الفاتورة
          </p>
          <p className="mt-1 font-mono text-xs font-semibold text-ink">
            {invoiceNo}
          </p>
          <p className="mt-1 text-xs text-muted">
            {paid
              ? "تُرسل تلقائيًا للمشتري عند نجاح الدفع — يمكنك إعادة الإرسال من هنا."
              : "تظهر الفاتورة وتُرسل بعد تأكيد الدفع."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const win = window.open("", "_blank", "noopener,noreferrer");
              if (!win) return;
              win.document.write(`<!doctype html><html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"/><title>${invoiceNo}</title>
                <style>body{margin:0;padding:24px;background:#f3f0ea;font-family:Tahoma,Arial,sans-serif;}</style></head><body>${html}</body></html>`);
              win.document.close();
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            عرض / طباعة
          </Button>
          {canSend && onSend ? (
            <Button
              disabled={!paid}
              loading={sendBusy}
              onClick={onSend}
              size="sm"
              type="button"
            >
              إرسال للمشتري
            </Button>
          ) : null}
        </div>
      </div>
      <div
        className="overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-[#faf9f7] p-2 text-[12px] leading-relaxed [&_table]:w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
