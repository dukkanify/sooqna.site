"use client";

import { useState } from "react";
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

function openPrintableInvoice(html: string, locale: "ar" | "en", title: string) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const documentHtml = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>
    body{margin:0;padding:24px;background:#f3f0ea;font-family:Tahoma,Arial,sans-serif;color:#1a2744;}
    .print-bar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px;}
    .print-bar button{appearance:none;border:1px solid #c9a962;background:#fff8e8;color:#1a2744;border-radius:10px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;}
    @media print{.print-bar{display:none!important;} body{padding:0;background:#fff;}}
  </style>
</head>
<body>
  <div class="print-bar">
    <button type="button" onclick="window.print()">طباعة</button>
    <button type="button" onclick="window.close()">إغلاق</button>
  </div>
  ${html}
  <script>window.addEventListener("load",function(){setTimeout(function(){try{window.focus();}catch(e){}},50);});</script>
</body>
</html>`;

  const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  // Revoke after the tab has a chance to load the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

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
  const [printError, setPrintError] = useState<string | null>(null);

  const lastInvoiceSend = [...(order.auditLog ?? [])]
    .reverse()
    .find(
      (event) =>
        event.type === "invoice_email" ||
        event.message.includes("فاتورة") ||
        event.message.toLowerCase().includes("invoice"),
    );

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
          {lastInvoiceSend ? (
            <p className="mt-1 text-xs text-muted">
              آخر إرسال: {lastInvoiceSend.message}
              {lastInvoiceSend.createdAt
                ? ` · ${new Date(lastInvoiceSend.createdAt).toLocaleString(
                    locale === "en" ? "en-AE" : "ar-AE",
                  )}`
                : ""}
              {lastInvoiceSend.metadata?.status
                ? ` · ${String(lastInvoiceSend.metadata.status)}`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const opened = openPrintableInvoice(html, locale, invoiceNo);
              setPrintError(
                opened
                  ? null
                  : "تعذّر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذه الصفحة ثم أعد المحاولة.",
              );
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
      {printError ? (
        <p className="text-xs font-semibold text-[var(--color-danger,#b42318)]">
          {printError}
        </p>
      ) : null}
      <div
        className="overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-[#faf9f7] p-2 text-[12px] leading-relaxed [&_table]:w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
