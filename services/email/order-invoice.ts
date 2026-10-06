import type { Order } from "@/types/domain/order";
import { BRAND, BRAND_COLORS } from "@/shared/constants/brand";
import { isGatewayPassedThrough } from "@/shared/payments/order-fees";
import { formatCurrencyLabel } from "@/shared/utils/currency";
import { escapeEmailHtml } from "@/services/email/sooqna-email-template";

export type InvoiceLocale = "ar" | "en";

function money(amount: number, locale: InvoiceLocale): string {
  return formatCurrencyLabel(amount, locale === "en" ? "en-AE" : "ar-AE");
}

function formatDate(value: string | undefined, locale: InvoiceLocale): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "en" ? "en-AE" : "ar-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function lineRow(
  label: string,
  amount: number,
  locale: InvoiceLocale,
  emphasize = false,
): string {
  const weight = emphasize ? "800" : "600";
  const size = emphasize ? "15px" : "13px";
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #ece7df;font-size:${size};font-weight:${weight};color:${BRAND_COLORS.navy};">${escapeEmailHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #ece7df;font-size:${size};font-weight:${weight};color:${BRAND_COLORS.navy};text-align:left;direction:ltr;white-space:nowrap;">${escapeEmailHtml(money(amount, locale))}</td>
  </tr>`;
}

export function invoiceNumberForOrder(order: Order): string {
  const stamp = (order.paidAt || order.createdAt || "")
    .slice(0, 10)
    .replace(/-/g, "");
  const shortId = order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `INV-${stamp || "DRAFT"}-${shortId || "ORDER"}`;
}

/** Professional invoice block for email + admin preview (HTML fragment). */
export function buildOrderInvoiceHtml(
  order: Order,
  locale: InvoiceLocale = "ar",
): string {
  const english = locale === "en";
  const invoiceNo = invoiceNumberForOrder(order);
  const fees = order.fees;
  const address = order.deliveryAddressSnapshot;
  const addressLine = address
    ? [
        address.fullName,
        address.phone,
        address.emirate,
        address.city,
        address.area,
        address.street,
        address.building,
        address.unit,
      ]
        .filter(Boolean)
        .join(english ? ", " : " · ")
    : english
      ? "Not provided"
      : "غير متوفر";

  const passThrough = isGatewayPassedThrough(fees);
  const rows = [
    lineRow(
      english ? "Item / listing" : "المنتج / الإعلان",
      fees.productPrice,
      locale,
    ),
    lineRow(english ? "Shipping" : "الشحن", fees.shippingFee, locale),
    lineRow(english ? "Platform fee" : "رسوم المنصة", fees.platformFee, locale),
    passThrough
      ? lineRow(english ? "Gateway fee" : "رسوم البوابة", fees.gatewayFee, locale)
      : "",
    lineRow(english ? "Total paid" : "الإجمالي المدفوع", fees.total, locale, true),
  ].join("");

  return `
    <div style="margin:18px 0 0;padding:16px;border:1px solid #e4dfd6;border-radius:14px;background:#fff;">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid ${BRAND_COLORS.gold};">
        <div>
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.06em;color:${BRAND_COLORS.goldDark};text-transform:uppercase;">${english ? "Tax invoice / receipt" : "فاتورة ضريبية / إيصال"}</p>
          <p style="margin:6px 0 0;font-size:18px;font-weight:800;color:${BRAND_COLORS.navy};">${english ? BRAND.nameEn : BRAND.nameAr}</p>
        </div>
        <div style="text-align:${english ? "right" : "left"};">
          <p style="margin:0;font-size:12px;color:#6b6560;">${english ? "Invoice no." : "رقم الفاتورة"}</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:800;color:${BRAND_COLORS.navy};font-family:ui-monospace,Menlo,monospace;">${escapeEmailHtml(invoiceNo)}</p>
        </div>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 12px;">
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#6b6560;width:40%;">${english ? "Order" : "الطلب"}</td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:${BRAND_COLORS.navy};font-family:ui-monospace,Menlo,monospace;">${escapeEmailHtml(order.id)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#6b6560;">${english ? "Date" : "التاريخ"}</td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:${BRAND_COLORS.navy};">${escapeEmailHtml(formatDate(order.paidAt || order.createdAt, locale))}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#6b6560;">${english ? "Buyer" : "المشتري"}</td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:${BRAND_COLORS.navy};">${escapeEmailHtml(order.buyerName)} · ${escapeEmailHtml(order.buyerEmail)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#6b6560;">${english ? "Seller" : "البائع"}</td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:${BRAND_COLORS.navy};">${escapeEmailHtml(order.sellerName)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#6b6560;">${english ? "Listing" : "الإعلان"}</td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:${BRAND_COLORS.navy};">${escapeEmailHtml(order.listingTitle)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#6b6560;">${english ? "Delivery" : "التسليم"}</td>
          <td style="padding:4px 0;font-size:12px;font-weight:700;color:${BRAND_COLORS.navy};">${escapeEmailHtml(addressLine)}</td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${rows}
      </table>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#6b6560;">
        ${
          english
            ? "Payment is held in Sooqna escrow until the buyer confirms receipt. This document is the official marketplace invoice for the purchase."
            : "المبلغ محجوز في ضمان سوقنا حتى يؤكد المشتري الاستلام. هذا المستند هو فاتورة المنصة الرسمية لعملية الشراء."
        }
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#8a837a;">${english ? BRAND.supportEmail : BRAND.supportEmail} · ${BRAND.domain}</p>
    </div>
  `.trim();
}

export function buildOrderInvoiceTextLines(
  order: Order,
  locale: InvoiceLocale = "ar",
): string[] {
  const english = locale === "en";
  const fees = order.fees;
  const invoiceNo = invoiceNumberForOrder(order);
  const passThrough = isGatewayPassedThrough(fees);
  return english
    ? [
        `Invoice: ${invoiceNo}`,
        `Order: ${order.id}`,
        `Listing: ${order.listingTitle}`,
        `Buyer: ${order.buyerName} <${order.buyerEmail}>`,
        `Seller: ${order.sellerName}`,
        `Item: ${money(fees.productPrice, locale)}`,
        `Shipping: ${money(fees.shippingFee, locale)}`,
        `Platform fee: ${money(fees.platformFee, locale)}`,
        ...(passThrough
          ? [`Gateway fee: ${money(fees.gatewayFee, locale)}`]
          : []),
        `Total: ${money(fees.total, locale)}`,
      ]
    : [
        `الفاتورة: ${invoiceNo}`,
        `الطلب: ${order.id}`,
        `الإعلان: ${order.listingTitle}`,
        `المشتري: ${order.buyerName} <${order.buyerEmail}>`,
        `البائع: ${order.sellerName}`,
        `المنتج: ${money(fees.productPrice, locale)}`,
        `الشحن: ${money(fees.shippingFee, locale)}`,
        `رسوم المنصة: ${money(fees.platformFee, locale)}`,
        ...(passThrough
          ? [`رسوم البوابة: ${money(fees.gatewayFee, locale)}`]
          : []),
        `الإجمالي: ${money(fees.total, locale)}`,
      ];
}

export function orderInvoiceEmailCopy(order: Order, locale: InvoiceLocale) {
  const english = locale === "en";
  const invoiceNo = invoiceNumberForOrder(order);
  return {
    invoiceNo,
    subject: english
      ? `Sooqna invoice ${invoiceNo} — ${order.listingTitle}`
      : `فاتورة سوقنا ${invoiceNo} — ${order.listingTitle}`,
    title: english ? "Your Sooqna purchase invoice" : "فاتورة مشترياتك من سوقنا",
    introHtml: english
      ? `<p style="font-size:16px;line-height:1.8;margin:0;">Thank you for your purchase. Below is your official invoice for order <strong>${escapeEmailHtml(order.id)}</strong>.</p>`
      : `<p style="font-size:16px;line-height:1.8;margin:0;">شكرًا لمشترياتك. فيما يلي فاتورتكم الرسمية للطلب رقم <strong>${escapeEmailHtml(order.id)}</strong>.</p>`,
  };
}
