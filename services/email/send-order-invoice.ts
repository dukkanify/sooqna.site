import type { Order } from "@/types/domain/order";
import { sendTransactionalEmail } from "@/services/email/transactional-email";
import {
  buildOrderInvoiceHtml,
  buildOrderInvoiceTextLines,
  orderInvoiceEmailCopy,
} from "@/services/email/order-invoice";
import { emailSiteUrl } from "@/services/email/sooqna-email-template";
import { resolveEmailLocale } from "@/shared/i18n/email-locale";
import type { EmailDeliveryStatus } from "@/services/email/email-log-store";
import { updateOrder } from "@/services/payments/order-store";
import { escapeEmailHtml } from "@/services/email/sooqna-email-template";

export async function sendOrderInvoiceEmail(
  order: Order,
  options?: {
    /** Force a new send even if a recent invoice email was logged. */
    force?: boolean;
    /** Audit actor (admin resend). */
    actorLabel?: string;
  },
): Promise<{ order: Order; status: EmailDeliveryStatus }> {
  const to = (order.buyerEmail || order.guestEmail || "").trim();
  if (!to.includes("@")) {
    throw new Error("NO_BUYER_EMAIL");
  }

  const locale = await resolveEmailLocale({
    userId: order.buyerId,
    email: to,
  });
  const copy = orderInvoiceEmailCopy(order, locale);
  const greetName = escapeEmailHtml(order.buyerName || (locale === "en" ? "customer" : "عميلنا"));
  const greet =
    locale === "en"
      ? `<p style="font-size:16px;line-height:1.8;margin:0 0 12px;">Hello ${greetName},</p>`
      : `<p style="font-size:16px;line-height:1.8;margin:0 0 12px;">مرحبًا ${greetName}،</p>`;

  const status = await sendTransactionalEmail({
    type: "order_invoice",
    to,
    userId: order.buyerId ?? undefined,
    entityId: order.id,
    locale,
    subject: copy.subject,
    title: copy.title,
    bodyHtml: `${greet}${copy.introHtml}${buildOrderInvoiceHtml(order, locale)}`,
    bodyLines: [
      ...(locale === "en"
        ? [`Hello ${order.buyerName},`, "Your Sooqna purchase invoice:"]
        : [`مرحبًا ${order.buyerName}،`, "فاتورة مشترياتك من سوقنا:"]),
      ...buildOrderInvoiceTextLines(order, locale),
    ],
    ctaHref: emailSiteUrl(
      order.buyerId ? `/orders/${order.id}` : "/orders",
    ),
    ctaLabel: locale === "en" ? "View order" : "عرض الطلب",
    dedupeWindowMs: options?.force ? 0 : undefined,
  });

  const auditMessage =
    status === "sent" || status === "skipped"
      ? options?.actorLabel
        ? `أُرسلت فاتورة ${copy.invoiceNo} إلى المشتري (${options.actorLabel})`
        : `أُرسلت فاتورة ${copy.invoiceNo} إلى المشتري`
      : `تعذّر إرسال فاتورة ${copy.invoiceNo} إلى المشتري`;

  const updated =
    (await updateOrder(
      order.id,
      {},
      {
        type: "invoice_email",
        message: auditMessage,
        metadata: {
          invoiceNo: copy.invoiceNo,
          status,
          to,
        },
      },
    )) ?? order;

  return { order: updated, status };
}

/** Invoice HTML fragment embedded into payment confirmation emails. */
export function invoiceBlockForPaidEmail(
  order: Order,
  locale: "ar" | "en",
): { html: string; lines: string[] } {
  return {
    html: buildOrderInvoiceHtml(order, locale),
    lines: buildOrderInvoiceTextLines(order, locale),
  };
}
