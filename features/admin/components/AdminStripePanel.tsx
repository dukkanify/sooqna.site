"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import { AdminStripeConnectPanel } from "@/features/admin/components/AdminStripeConnectPanel";
import { adminFetch } from "@/features/admin/lib/admin-fetch";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";

type StripePayload = {
  counts: {
    events: number;
    failedOrPending: number;
    ordersWithStripe: number;
    refunded: number;
  };
  links: {
    apiKeys: string;
    balances: string;
    customers: string;
    dashboard: string;
    disputes: string;
    payments: string;
    webhooks: string;
  };
  recentEvents: {
    createdAt: string;
    id: string;
    orderId?: string;
    type: string;
  }[];
  recentStripeOrders: {
    amount: number;
    createdAt: string;
    id: string;
    paymentStatus: string;
    status: string;
    stripePaymentIntentId?: string;
    title: string;
  }[];
  status: {
    configured: boolean;
    currency: string;
    envManaged: boolean;
    mockAllowed: boolean;
    publishableConfigured: boolean;
    publishableKeyMasked: string | null;
    secretKeyMasked: string | null;
    secretKeyPresent: boolean;
    source: "env" | "admin" | "none";
    updatedAt: string | null;
    webhookConfigured: boolean;
    webhookEndpoint: string;
    webhookSecretMasked: string | null;
  };
};

/** Platform keys live in Vercel Production — never paste secrets in the browser. */
export function AdminStripePanel() {
  const locale = useLocale();
  const [data, setData] = useState<StripePayload | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    let cancelled = false;
    adminFetch("/api/admin/stripe")
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled && payload?.status) setData(payload as StripePayload);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="admin-desk grid gap-4">
        <div className="admin-desk-toolbar">
          <p className="text-sm text-muted">
            إعدادات Stripe وConnect — حالة المنصة وربط الحسابات.
          </p>
        </div>
        <AdminStripeConnectPanel mode="manage" />
        <Card className="admin-desk-table-card p-8 text-center" variant="flat">
          <p className="text-sm text-muted">جاري تحميل حالة Stripe...</p>
        </Card>
      </div>
    );
  }

  const { status, links, counts, recentStripeOrders, recentEvents } = data;

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          إعدادات Stripe وConnect — حالة المنصة وربط الحسابات.
        </p>
        <div className="admin-desk-toolbar__actions">
          <Button href="/admin/escrow" size="sm" variant="secondary">
            الضمان
          </Button>
          <Button href="/admin/orders" size="sm" variant="ghost">
            الطلبات
          </Button>
        </div>
      </div>

      <AdminStripeConnectPanel
        key={`connect-${status.configured ? "ready" : "waiting"}`}
        mode="manage"
        platformConfigured={status.configured}
      />

      <Card className="admin-desk-help p-5" variant="flat">
        <h2 className="text-sm font-semibold text-ink">إعداد المنصة (خوادم)</h2>
        <p className="mt-2 text-xs text-muted">
          مفاتيح Stripe الرئيسية تُضبط مرة واحدة عبر Vercel Production. لا تُدخل Secret
          Key أو Webhook Secret في المتصفح.
        </p>

        {!status.configured ? (
          <div className="mt-3">
            <FormMessage variant="error">
              إعداد Stripe الرئيسي غير مكتمل. يرجى إكمال إعدادات المنصة.
            </FormMessage>
          </div>
        ) : (
          <div className="mt-3">
            <FormMessage variant="success">
              إعداد Stripe الرئيسي مكتمل على الخادم. يمكنك متابعة ربط Connect أدناه.
            </FormMessage>
          </div>
        )}

        <div className="admin-ops__status-row" style={{ marginTop: "1rem" }}>
          <div
            className={`admin-ops__status-chip${
              status.configured
                ? " admin-ops__status-chip--ok"
                : " admin-ops__status-chip--warn"
            }`}
          >
            المنصة: {status.configured ? "جاهزة" : "غير مكتملة"}
          </div>
          <div
            className={`admin-ops__status-chip${
              status.publishableConfigured ? " admin-ops__status-chip--ok" : ""
            }`}
          >
            Publishable: {status.publishableConfigured ? "مضبوط" : "ناقص"}
          </div>
          <div
            className={`admin-ops__status-chip${
              status.webhookConfigured ? " admin-ops__status-chip--ok" : ""
            }`}
          >
            Webhook: {status.webhookConfigured ? "مضبوط" : "ناقص"}
          </div>
          <div className="admin-ops__status-chip">
            المصدر:{" "}
            {status.source === "env"
              ? "Vercel Env"
              : status.source === "admin"
                ? "مخزّن على الخادم"
                : "غير مضبوط"}
          </div>
          <div className="admin-ops__status-chip">
            العملة {status.currency.toUpperCase()}
          </div>
          <div className="admin-ops__status-chip">
            Mock: {status.mockAllowed ? "مسموح" : "مغلق"}
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">
          Webhook endpoint:{" "}
          <code className="text-[0.7rem]">{status.webhookEndpoint}</code>
        </p>
      </Card>

      <Card className="admin-desk-help p-5" variant="flat">
        <h2 className="text-sm font-semibold text-ink">روابط لوحة Stripe</h2>
        <div
          className="admin-ops__quick-links"
          style={{ marginTop: "0.85rem" }}
        >
          {[
            ["Dashboard", links.dashboard],
            ["Payments", links.payments],
            ["Webhooks", links.webhooks],
            ["Customers", links.customers],
            ["Balance", links.balances],
            ["Disputes", links.disputes],
          ].map(([label, href]) => (
            <a
              key={label}
              className="admin-ops__chip-link"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {label}
            </a>
          ))}
        </div>
      </Card>

      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">طلبات بـ PaymentIntent</p>
          <p className="admin-ops__kpi-value">{counts.ordersWithStripe}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">فشل / معلّق</p>
          <p className="admin-ops__kpi-value">{counts.failedOrPending}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">مسترد</p>
          <p className="admin-ops__kpi-value">{counts.refunded}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">أحداث الدفع</p>
          <p className="admin-ops__kpi-value">{counts.events}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">طلبات مرتبطة بـ Stripe</h2>
        <Link className="admin-ops__text-link" href="/admin/orders">
          كل الطلبات
        </Link>
      </div>
      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الطلب</th>
                <th>المعرّف</th>
                <th>المبلغ</th>
                <th>الدفع</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentStripeOrders.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={5}>
                    لا توجد طلبات مرتبطة بعد.
                  </td>
                </tr>
              ) : (
                recentStripeOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-desk-cell-wrap">
                      <p className="admin-desk-cell-title">{order.title}</p>
                    </td>
                    <td className="font-mono text-xs">
                      {order.stripePaymentIntentId ?? order.id}
                    </td>
                    <td>
                      <CurrencyAmount amount={order.amount} size="sm" />
                    </td>
                    <td>
                      <Badge variant="muted">{order.paymentStatus}</Badge>
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString(
                        intlLocale(locale),
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ul className="admin-desk-mobile-list">
          {recentStripeOrders.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لا توجد طلبات مرتبطة بعد.</p>
            </li>
          ) : (
            recentStripeOrders.map((order) => (
              <li key={order.id} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                    {order.title}
                  </p>
                  <Badge variant="muted">{order.paymentStatus}</Badge>
                </div>
                <div className="admin-desk-mobile-card__meta">
                  <CurrencyAmount amount={order.amount} size="sm" />
                  <span className="font-mono text-xs">
                    {order.stripePaymentIntentId ?? order.id}
                  </span>
                  <span>
                    {new Date(order.createdAt).toLocaleString(
                      intlLocale(locale),
                    )}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <h2 className="text-sm font-semibold text-ink">سجل أحداث الدفع</h2>
      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>النوع</th>
                <th>الطلب</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={3}>
                    لا أحداث بعد.
                  </td>
                </tr>
              ) : (
                recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="admin-desk-cell-wrap">
                      <p className="admin-desk-cell-title">{event.type}</p>
                    </td>
                    <td className="font-mono text-xs">
                      {event.orderId ?? "—"}
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(event.createdAt).toLocaleString(
                        intlLocale(locale),
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ul className="admin-desk-mobile-list">
          {recentEvents.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لا أحداث بعد.</p>
            </li>
          ) : (
            recentEvents.map((event) => (
              <li key={event.id} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                    {event.type}
                  </p>
                </div>
                <div className="admin-desk-mobile-card__meta">
                  {event.orderId ? <span>{event.orderId}</span> : null}
                  <span>
                    {new Date(event.createdAt).toLocaleString(
                      intlLocale(locale),
                    )}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
