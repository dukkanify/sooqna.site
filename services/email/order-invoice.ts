import type { Order } from "@/types/domain/order";
import { BRAND, BRAND_COLORS } from "@/shared/constants/brand";
import { buyerFacingInvoiceFees } from "@/shared/payments/order-fees";
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

function metaCell(label: string, value: string): string {
  return `<td style="width:50%;padding:0 0 14px;vertical-align:top;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#8a837a;">${escapeEmailHtml(label)}</p>
    <p style="margin:0;font-size:14px;line-height:1.55;font-weight:650;color:${BRAND_COLORS.navy};">${value}</p>
  </td>`;
}

function amountRow(
  label: string,
  amount: number,
  locale: InvoiceLocale,
  options?: { emphasize?: boolean; muted?: boolean },
): string {
  const emphasize = Boolean(options?.emphasize);
  const muted = Boolean(options?.muted);
  const color = muted ? "#6b6560" : BRAND_COLORS.navy;
  const weight = emphasize ? "800" : "600";
  const size = emphasize ? "16px" : "14px";
  const pad = emphasize ? "14px 0 0" : "10px 0";
  const border = emphasize
    ? `border-top:2px solid ${BRAND_COLORS.navy};`
    : "border-bottom:1px solid #efeae2;";
  return `<tr>
    <td style="padding:${pad};${border}font-size:${size};font-weight:${weight};color:${color};">${escapeEmailHtml(label)}</td>
    <td style="padding:${pad};${border}font-size:${size};font-weight:${weight};color:${color};text-align:left;direction:ltr;white-space:nowrap;">${escapeEmailHtml(money(amount, locale))}</td>
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
  const fees = buyerFacingInvoiceFees(order.fees);
  const address = order.deliveryAddressSnapshot;
  const addressLines = address
    ? [
        address.fullName,
        address.phone,
        [address.area, address.city, address.emirate].filter(Boolean).join("، "),
        [address.street, address.building, address.unit].filter(Boolean).join(" · "),
      ].filter(Boolean)
    : [];

  const buyerBlock = [
    escapeEmailHtml(order.buyerName || (english ? "Buyer" : "المشتري")),
    order.buyerEmail
      ? `<span style="display:block;font-size:12px;font-weight:500;color:#6b6560;direction:ltr;text-align:inherit;">${escapeEmailHtml(order.buyerEmail)}</span>`
      : "",
  ].join("");

  const sellerBlock = escapeEmailHtml(
    order.sellerName || (english ? "Seller" : "البائع"),
  );

  const deliveryBlock =
    addressLines.length > 0
      ? addressLines
          .map((line) => escapeEmailHtml(line))
          .join("<br/>")
      : escapeEmailHtml(english ? "Not provided" : "غير متوفر");

  const rows = [
    amountRow(
      english ? "Item" : "المنتج",
      fees.productPrice,
      locale,
    ),
    fees.shippingFee > 0
      ? amountRow(english ? "Shipping" : "الشحن", fees.shippingFee, locale, {
          muted: true,
        })
      : "",
    fees.platformFee > 0
      ? amountRow(
          english ? "Service fee" : "رسوم الخدمة",
          fees.platformFee,
          locale,
          { muted: true },
        )
      : "",
    amountRow(
      english ? "Total paid" : "الإجمالي المدفوع",
      fees.total,
      locale,
      { emphasize: true },
    ),
  ].join("");

  return `
    <div style="margin:0;padding:0;border:1px solid #e7e1d6;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 10px 30px rgba(11,22,40,0.06);">
      <div style="height:4px;background:linear-gradient(90deg, ${BRAND_COLORS.goldDark}, ${BRAND_COLORS.gold}, ${BRAND_COLORS.goldLight});"></div>
      <div style="padding:22px 22px 8px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px;">
          <tr>
            <td style="vertical-align:top;padding:0;">
              <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.08em;color:${BRAND_COLORS.goldDark};text-transform:uppercase;">${english ? "Official receipt" : "إيصال رسمي"}</p>
              <p style="margin:8px 0 0;font-size:26px;line-height:1.15;font-weight:800;color:${BRAND_COLORS.navy};">${english ? BRAND.nameEn : BRAND.nameAr}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#6b6560;">${english ? BRAND.taglineEn : BRAND.taglineAr}</p>
            </td>
            <td style="vertical-align:top;padding:0;text-align:${english ? "right" : "left"};">
              <p style="margin:0;font-size:11px;font-weight:700;color:#8a837a;text-transform:uppercase;">${english ? "Invoice" : "رقم الفاتورة"}</p>
              <p style="margin:6px 0 0;font-size:15px;font-weight:800;color:${BRAND_COLORS.navy};font-family:ui-monospace,Menlo,monospace;">${escapeEmailHtml(invoiceNo)}</p>
              <p style="margin:8px 0 0;font-size:12px;color:#6b6560;">${escapeEmailHtml(formatDate(order.paidAt || order.createdAt, locale))}</p>
            </td>
          </tr>
        </table>

        <div style="padding:14px 16px;margin:0 0 18px;border-radius:14px;background:#f7f4ee;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#8a837a;">${english ? "Listing" : "الإعلان"}</p>
          <p style="margin:0;font-size:16px;line-height:1.45;font-weight:750;color:${BRAND_COLORS.navy};">${escapeEmailHtml(order.listingTitle)}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#8a837a;font-family:ui-monospace,Menlo,monospace;">${escapeEmailHtml(order.id)}</p>
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 8px;">
          <tr>
            ${metaCell(english ? "Buyer" : "المشتري", buyerBlock, locale)}
            ${metaCell(english ? "Seller" : "البائع", sellerBlock, locale)}
          </tr>
          <tr>
            ${metaCell(english ? "Delivery" : "التسليم", deliveryBlock, locale)}
            ${metaCell(
              english ? "Payment" : "الدفع",
              escapeEmailHtml(
                english
                  ? "Card · held in Sooqna escrow"
                  : "بطاقة · محجوز في ضمان سوقنا",
              ),
              locale,
            )}
          </tr>
        </table>
      </div>

      <div style="padding:4px 22px 22px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          ${rows}
        </table>
        <p style="margin:16px 0 0;padding:12px 14px;border-radius:12px;background:#f7f4ee;font-size:12px;line-height:1.7;color:#5f5952;">
          ${
            english
              ? "Funds stay in Sooqna escrow until the buyer confirms receipt. This is the official marketplace receipt for the purchase."
              : "المبلغ يبقى في ضمان سوقنا حتى يؤكد المشتري الاستلام. هذا الإيصال الرسمي لعملية الشراء عبر المنصة."
          }
        </p>
        <p style="margin:12px 0 0;font-size:11px;color:#9a9288;">${BRAND.supportEmail} · ${BRAND.domain}</p>
      </div>
    </div>
  `.trim();
}

export function buildOrderInvoiceTextLines(
  order: Order,
  locale: InvoiceLocale = "ar",
): string[] {
  const english = locale === "en";
  const fees = buyerFacingInvoiceFees(order.fees);
  const invoiceNo = invoiceNumberForOrder(order);
  return english
    ? [
        `Invoice: ${invoiceNo}`,
        `Order: ${order.id}`,
        `Listing: ${order.listingTitle}`,
        `Buyer: ${order.buyerName} <${order.buyerEmail}>`,
        `Seller: ${order.sellerName}`,
        `Item: ${money(fees.productPrice, locale)}`,
        `Shipping: ${money(fees.shippingFee, locale)}`,
        `Service fee: ${money(fees.platformFee, locale)}`,
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
        `رسوم الخدمة: ${money(fees.platformFee, locale)}`,
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
