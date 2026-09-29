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
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
import Link from "next/link";

type AdminOrderInlineDeskProps = {
  busy: boolean;
  locale: AppLocale;
  onReasonChange: (value: string) => void;
  onRefund?: () => void;
  onRelease?: () => void;
  order: Order;
  reasonDraft: string;
  showRefund: boolean;
  showRelease: boolean;
};

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
      <dt className="font-medium text-muted">{label}</dt>
      <dd className="text-end font-semibold text-ink">{value}</dd>
    </div>
  );
}

function formatWhen(locale: AppLocale, value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleString(intlLocale(locale));
}

export function AdminOrderInlineDesk({
  busy,
  locale,
  onReasonChange,
  onRefund,
  onRelease,
  order,
  reasonDraft,
  showRefund,
  showRelease,
}: AdminOrderInlineDeskProps) {
  const address = order.deliveryAddressSnapshot;
  const proofUrls = order.sellerProofUrls ?? [];
  const fees = order.fees;

  return (
    <div className="mt-4 grid gap-4 border-t border-border/70 pt-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          مكتب الطلب
        </p>
        <p className="mt-1 text-xs text-muted">
          التفاصيل والإجراءات الإدارية هنا — دون التحويل لرحلة المشتري أو الدفع في
          الموقع.
        </p>
      </div>

      <dl className="grid gap-2 rounded-[var(--radius-xl)] border border-border bg-surface-muted/40 px-3 py-3 sm:grid-cols-2">
        <MetaRow label="حالة الطلب" value={orderStatusLabel(order.status)} />
        <MetaRow
          label="الضمان"
          value={escrowStatusLabel(order.escrowStatus)}
        />
        <MetaRow
          label="الدفع"
          value={paymentStatusLabel(order.paymentStatus)}
        />
        <MetaRow
          label="التوثيق"
          value={
            order.productVerificationStatus
              ? productVerificationStatusLabel(order.productVerificationStatus)
              : null
          }
        />
        <MetaRow label="المشتري" value={order.buyerName} />
        <MetaRow label="بريد المشتري" value={order.buyerEmail} />
        <MetaRow label="البائع" value={order.sellerName} />
        <MetaRow label="معرّف الإعلان" value={order.listingId} />
        <MetaRow
          label="سعر المنتج"
          value={<CurrencyAmount amount={fees.productPrice} size="sm" />}
        />
        <MetaRow
          label="الشحن"
          value={<CurrencyAmount amount={fees.shippingFee} size="sm" />}
        />
        <MetaRow
          label="رسوم المنصة"
          value={<CurrencyAmount amount={fees.platformFee} size="sm" />}
        />
        <MetaRow
          label="رسوم البوابة"
          value={<CurrencyAmount amount={fees.gatewayFee} size="sm" />}
        />
        <MetaRow
          label="الإجمالي"
          value={<CurrencyAmount amount={fees.total} size="sm" />}
        />
        <MetaRow
          label="Stripe PaymentIntent"
          value={
            order.stripePaymentIntentId ? (
              <span className="font-mono text-xs">
                {order.stripePaymentIntentId}
              </span>
            ) : null
          }
        />
        <MetaRow
          label="Stripe Checkout"
          value={
            order.stripeCheckoutSessionId ? (
              <span className="font-mono text-xs">
                {order.stripeCheckoutSessionId}
              </span>
            ) : null
          }
        />
        <MetaRow
          label="Stripe Refund"
          value={
            order.stripeRefundId ? (
              <span className="font-mono text-xs">{order.stripeRefundId}</span>
            ) : null
          }
        />
        <MetaRow
          label="Stripe Transfer"
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
        <MetaRow label="أُنشئ" value={formatWhen(locale, order.createdAt)} />
        <MetaRow label="دُفع" value={formatWhen(locale, order.paidAt)} />
        <MetaRow label="أُكّد" value={formatWhen(locale, order.confirmedAt)} />
        <MetaRow label="حُرّر" value={formatWhen(locale, order.releasedAt)} />
        <MetaRow
          label="استُرد"
          value={formatWhen(locale, order.refundedAt)}
        />
      </dl>

      {address ? (
        <div className="grid gap-1 rounded-[var(--radius-xl)] border border-border px-3 py-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            عنوان التسليم
          </p>
          <p className="font-semibold text-ink">
            {address.fullName} · {address.phone}
          </p>
          <p className="text-muted">
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
            <p className="text-muted">ملاحظات: {address.notes}</p>
          ) : null}
        </div>
      ) : null}

      {proofUrls.length > 0 ? (
        <div className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            أدلة البائع
          </p>
          <ul className="grid gap-1">
            {proofUrls.map((url) => (
              <li key={url}>
                <a
                  className="admin-ops__text-link break-all"
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
        </div>
      ) : null}

      {order.auditLog.length > 0 ? (
        <div className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            سجل الأحداث
          </p>
          <ul className="grid max-h-48 gap-1 overflow-y-auto">
            {order.auditLog.map((event) => (
              <li key={event.id} className="admin-ops__queue-meta">
                <span className="font-medium text-ink">{event.message}</span>
                {" · "}
                {formatWhen(locale, event.createdAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {showRelease && onRelease ? (
          <Button
            loading={busy}
            onClick={onRelease}
            size="sm"
            type="button"
          >
            تحرير ضمان
          </Button>
        ) : null}
        {order.status === "disputed" ? (
          <Button href="/admin/disputes" size="sm" type="button" variant="ghost">
            مكتب النزاعات
          </Button>
        ) : null}
        {order.listingSlug ? (
          <Link
            className="admin-ops__text-link self-center text-xs"
            href={`/listings/${order.listingSlug}`}
          >
            صفحة الإعلان (مرجع)
          </Link>
        ) : null}
      </div>

      {showRefund && onRefund ? (
        <div className="grid gap-2 rounded-[var(--radius-xl)] border border-border px-3 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            استرداد إداري
          </p>
          <Textarea
            label="سبب الاسترداد (اختياري — يظهر في السجل)"
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
        </div>
      ) : null}
    </div>
  );
}
