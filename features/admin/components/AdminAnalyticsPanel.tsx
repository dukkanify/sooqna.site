"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Card } from "@/shared/ui/Card";

type AnalyticsPayload = {
  daily: {
    date: string;
    fees: number;
    label: string;
    orders: number;
    volume: number;
  }[];
  orderStatuses: { count: number; key: string; label: string }[];
  overview: {
    conversionRate: number;
    currency: string;
    fees: number;
    paidOrders: number;
    recentEvents: number;
    totalListings: number;
    totalOrders: number;
    totalUsers: number;
    volume: number;
    walletAccounts: number;
  };
  paymentStatuses: { count: number; key: string; label: string }[];
  topCategories: { count: number; key: string; label: string }[];
};

function StatusDeskTable({
  title,
  rows,
  emptyLabel,
  valueHeader = "العدد",
}: {
  title: string;
  rows: { count: number; key: string; label: string }[];
  emptyLabel: string;
  valueHeader?: string;
}) {
  return (
    <div className="grid gap-2">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>{valueHeader}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={2}>
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                rows.map((slice) => (
                  <tr key={slice.key}>
                    <td className="admin-desk-cell-wrap">
                      <p className="admin-desk-cell-title">{slice.label}</p>
                    </td>
                    <td className="font-bold text-ink">{slice.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ul className="admin-desk-mobile-list">
          {rows.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">{emptyLabel}</p>
            </li>
          ) : (
            rows.map((slice) => (
              <li key={slice.key} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                    {slice.label}
                  </p>
                  <span className="text-sm font-bold text-ink">
                    {slice.count}
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

export function AdminAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.overview) setData(payload as AnalyticsPayload);
      })
      .catch(() => undefined);
  }, []);

  if (!data) {
    return (
      <div className="admin-desk grid gap-4">
        <Card className="admin-desk-table-card p-8 text-center" variant="flat">
          <p className="text-sm text-muted">جاري تحميل التحليلات...</p>
        </Card>
      </div>
    );
  }

  const maxVolume = Math.max(...data.daily.map((d) => d.volume), 1);

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          تحليلات المنصة — الحجم، الرسوم، التحويل، واتجاه الأيام الأخيرة.
        </p>
      </div>

      <div className="admin-ops__kpi-grid admin-ops__kpi-grid--wide">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">الحجم الكلي</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={data.overview.volume} size="md" />
          </div>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">رسوم المنصة</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={data.overview.fees} size="md" />
          </div>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">التحويل</p>
          <p className="admin-ops__kpi-value">
            {data.overview.conversionRate}%
          </p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">المستخدمون / الإعلانات</p>
          <p className="admin-ops__kpi-value">
            {data.overview.totalUsers} / {data.overview.totalListings}
          </p>
        </div>
      </div>

      <Card className="admin-desk-help p-5" variant="flat">
        <h2 className="text-sm font-semibold text-ink">اتجاه 14 يوماً</h2>
        <div className="admin-ops__bars" style={{ marginTop: "1rem" }}>
          {data.daily.map((point) => (
            <div key={point.date} className="admin-ops__bar-col">
              <div className="admin-ops__bar-track">
                <div
                  className="admin-ops__bar-fill"
                  style={{
                    height: `${Math.max(8, (point.volume / maxVolume) * 100)}%`,
                  }}
                />
              </div>
              <p className="admin-ops__bar-value">{point.orders}</p>
              <p className="admin-ops__bar-label">{point.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusDeskTable
          emptyLabel="لا حالات طلبات."
          rows={data.orderStatuses}
          title="حالات الطلبات"
        />
        <StatusDeskTable
          emptyLabel="لا حالات دفع."
          rows={data.paymentStatuses}
          title="حالات الدفع"
        />
      </div>

      <StatusDeskTable
        emptyLabel="لا تصنيفات بعد."
        rows={data.topCategories}
        title="أعلى التصنيفات بالإعلانات"
        valueHeader="الإعلانات"
      />

      <div className="flex flex-wrap gap-3">
        <Link className="admin-ops__chip-link" href="/admin/reports">
          التقارير المالية
        </Link>
        <Link className="admin-ops__chip-link" href="/admin">
          غرفة التحكم
        </Link>
      </div>
    </div>
  );
}
