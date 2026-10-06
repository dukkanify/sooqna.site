"use client";

import type { ReactNode } from "react";
import type { AppLocale } from "@/shared/i18n/locale";
import { intlLocale } from "@/shared/i18n/locale";
import type { Order } from "@/types";
import {
  escrowStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
  productVerificationStatusLabel,
} from "@/services/activity/activity-labels";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { listingDetailsHref } from "@/shared/listings/listing-url";
import { buyerFacingInvoiceFees } from "@/shared/payments/order-fees";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
import { OrderInvoicePreview } from "@/features/admin/components/OrderInvoicePreview";

type AdminOrderInlineDeskProps = {
  busy: boolean;
  invoiceBusy?: boolean;
  locale: AppLocale;
  notifyBusy?: boolean;
  onNotifyPayment?: () => void;
  onReasonChange: (value: string) => void;
  onRefund?: () => void;
  onRelease?: () => void;
  onSendInvoice?: () => void;
  order: Order;
  reasonDraft: string;
  showRefund: boolean;
  showRelease: boolean;
};

function Section({
  children,
  title,
  hint,
}: {
  children: ReactNode;
  hint?: string;
  title: string;
}) {
  return (
    <section className="grid gap-2 rounded-[var(--radius-xl)] border border-border bg-surface-muted/35 px-3 py-3">
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-start gap-x-3 gap-y-1 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-start font-semibold text-ink sm:text-end">
        {value}
      </dd>
    </div>
  );
}

function formatWhen(locale: AppLocale, value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleString(intlLocale(locale));
}

function isAwaitingBuyerPayment(order: Order): boolean {
  return (
    order.status === "pending_payment" || order.paymentStatus === "pending"
  );
}

export function AdminOrderInlineDesk({
  busy,
  invoiceBusy = false,
  locale,
  notifyBusy = false,
  onNotifyPayment,
  onReasonChange,
  onRefund,
  onRelease,
  onSendInvoice,
  order,
  reasonDraft,
  showRefund,
  showRelease,
}: AdminOrderInlineDeskProps) {
  const address = order.deliveryAddressSnapshot;
  const proofUrls = order.sellerProofUrls ?? [];
  const fees = order.fees;
  const buyerFees = buyerFacingInvoiceFees(fees);
  const awaitingPayment = isAwaitingBuyerPayment(order);
  const invoiceLocale = locale === "en" ? "en" : "ar";
  const listingHref = listingDetailsHref({
    id: order.listingId,
    slug: order.listingSlug,
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface px-3 py-3">
        <p className="text-sm font-bold text-ink">ملخص إداري للطلب</p>
        <p className="mt-1 text-xs leading-6 text-muted">
          كل التفاصيل والإجراءات هنا داخل اللوحة. لن يتم تحويلك لصفحة الدفع أو
          رحلة المشتري.
        </p>
      </div>

      {awaitingPayment ? (
        <div className="rounded-[var(--radius-xl)] border border-amber-300/70 bg-amber-50 px-3 py-3 text-sm text-ink">
          <p className="font-semibold">بانتظار دفع المشتري</p>
          <p className="mt-1 text-xs leading-6 text-muted">
            الأدمن لا يكمل الدفع نيابة عن المشتري. أرسل تنبيهًا ليُكمل الدفع من
            حسابه.
          </p>
          {onNotifyPayment && order.buyerId ? (
            <div className="mt-3">
              <Button
                loading={notifyBusy}
                onClick={onNotifyPayment}
                size="sm"
                type="button"
                variant="secondary"
              >
                تنبيه المشتري لإكمال الدفع
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              لا يوجد مشتري مسجّل لإشعار داخل التطبيق (طلب ضيف).
            </p>
          )}
        </div>
      ) : null}

      {listingHref ? (
        <Section
          hint="مرجع سريع للإعلان المرتبط بهذا الطلب."
          title="الإعلان"
        >
          <p className="text-sm font-semibold text-ink">
            <a className="hover:underline" href={listingHref} rel="noreferrer" target="_blank">
              {order.listingTitle}
            </a>
          </p>
          <a
            className="admin-ops__text-link text-xs"
            href={listingHref}
            rel="noreferrer"
            target="_blank"
          >
            فتح صفحة الإعلان
          </a>
        </Section>
      ) : null}

      <Section title="الحالة">
        <dl className="grid gap-2 sm:grid-cols-2">
          <MetaRow label="الطلب" value={orderStatusLabel(order.status)} />
          <MetaRow label="الضمان" value={escrowStatusLabel(order.escrowStatus)} />
          <MetaRow label="الدفع" value={paymentStatusLabel(order.paymentStatus)} />
          <MetaRow
            label="التوثيق"
            value={
              order.productVerificationStatus
                ? productVerificationStatusLabel(order.productVerificationStatus)
                : null
            }
          />
        </dl>
      </Section>

      <Section title="الأطراف">
        <dl className="grid gap-2 sm:grid-cols-2">
          <MetaRow label="المشتري" value={order.buyerName} />
          <MetaRow label="بريد المشتري" value={order.buyerEmail} />
          <MetaRow label="البائع" value={order.sellerName} />
        </dl>
      </Section>

      <Section
        hint="تفصيل المبالغ كما في فاتورة المشتري (بدون رسوم بوابة منفصلة)."
        title="المبالغ"
      >
        <dl className="grid gap-2 sm:grid-cols-2">
          <MetaRow
            label="سعر المنتج"
            value={<CurrencyAmount amount={buyerFees.productPrice} size="sm" />}
          />
          <MetaRow
            label="الشحن"
            value={<CurrencyAmount amount={buyerFees.shippingFee} size="sm" />}
          />
          <MetaRow
            label="رسوم الخدمة"
            value={<CurrencyAmount amount={buyerFees.platformFee} size="sm" />}
          />
          <MetaRow
            label="تكلفة البوابة (داخلي — لا تظهر للمشتري)"
            value={<CurrencyAmount amount={fees.gatewayFee} size="sm" />}
          />
          <MetaRow
            label="الإجمالي"
            value={<CurrencyAmount amount={buyerFees.total} size="sm" />}
          />
        </dl>
      </Section>

      <OrderInvoicePreview
        canSend={Boolean(
          onSendInvoice && (order.buyerEmail || order.guestEmail),
        )}
        locale={invoiceLocale}
        onSend={onSendInvoice}
        order={order}
        sendBusy={invoiceBusy}
      />

      <Section title="مراجع الدفع">
        <dl className="grid gap-2">
          <MetaRow
            label="PaymentIntent"
            value={
              order.stripePaymentIntentId ? (
                <span className="font-mono text-xs">
                  {order.stripePaymentIntentId}
                </span>
              ) : null
            }
          />
          <MetaRow
            label="Checkout"
            value={
              order.stripeCheckoutSessionId ? (
                <span className="font-mono text-xs">
                  {order.stripeCheckoutSessionId}
                </span>
              ) : null
            }
          />
          <MetaRow
            label="Refund"
            value={
              order.stripeRefundId ? (
                <span className="font-mono text-xs">{order.stripeRefundId}</span>
              ) : null
            }
          />
          <MetaRow
            label="Transfer"
            value={
              order.stripeTransferId ? (
                <span className="font-mono text-xs">{order.stripeTransferId}</span>
              ) : null
            }
          />
          <MetaRow
            label="تتبع الشحن"
            value={order.shippingTrackingRef ?? null}
          />
        </dl>
      </Section>

      <Section title="الجدول الزمني">
        <dl className="grid gap-2 sm:grid-cols-2">
          <MetaRow label="أُنشئ" value={formatWhen(locale, order.createdAt)} />
          <MetaRow label="دُفع" value={formatWhen(locale, order.paidAt)} />
          <MetaRow label="أُكّد" value={formatWhen(locale, order.confirmedAt)} />
          <MetaRow label="حُرّر" value={formatWhen(locale, order.releasedAt)} />
          <MetaRow label="استُرد" value={formatWhen(locale, order.refundedAt)} />
        </dl>
      </Section>

      {address ? (
        <Section title="عنوان التسليم">
          <p className="text-sm font-semibold text-ink">
            {address.fullName} · {address.phone}
          </p>
          <p className="text-sm text-muted">
            {[
              address.emirate,
              address.city,
              address.area,
              address.street,
              address.building,
              address.unit,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {address.notes ? (
            <p className="text-sm text-muted">ملاحظات: {address.notes}</p>
          ) : null}
        </Section>
      ) : null}

      {proofUrls.length > 0 ? (
        <Section title="أدلة البائع">
          <ul className="grid gap-1">
            {proofUrls.map((url) => (
              <li key={url}>
                <a
                  className="admin-ops__text-link break-all text-xs"
                  href={url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
          {order.sellerProofNote ? (
            <p className="text-sm text-muted">
              ملاحظة البائع: {order.sellerProofNote}
            </p>
          ) : null}
        </Section>
      ) : null}

      {order.auditLog.length > 0 ? (
        <Section title="سجل الأحداث">
          <ul className="grid max-h-48 gap-1 overflow-y-auto">
            {order.auditLog.map((event) => (
              <li key={event.id} className="admin-ops__queue-meta">
                <span className="font-medium text-ink">{event.message}</span>
                {" · "}
                {formatWhen(locale, event.createdAt)}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {showRelease && onRelease ? (
          <Button loading={busy} onClick={onRelease} size="sm" type="button">
            تحرير الضمان
          </Button>
        ) : null}
        {order.status === "disputed" ? (
          <Button href="/admin/disputes" size="sm" type="button" variant="ghost">
            مكتب النزاعات
          </Button>
        ) : null}
      </div>

      {showRefund && onRefund ? (
        <Section
          hint="يُسجَّل السبب في سجل الطلب عند التأكيد."
          title="استرداد إداري"
        >
          <Textarea
            label="سبب الاسترداد (اختياري)"
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
            value={reasonDraft}
          />
          <Button
            loading={busy}
            onClick={onRefund}
            size="sm"
            type="button"
            variant="ghost"
          >
            تأكيد الاسترداد
          </Button>
        </Section>
      ) : null}
    </div>
  );
}
