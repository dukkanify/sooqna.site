"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useState } from "react";
import type { ServerFavorite } from "@/types/domain/server-favorite";
import { getSessionUser } from "@/services/storage";
import { Card } from "@/shared/ui/Card";

type FavoritesPayload = {
  favorites: ServerFavorite[];
  summary: { total: number; uniqueListings: number; uniqueUsers: number };
  topListings: { count: number; listingId: string }[];
};

export function AdminFavoritesPanel() {
  const locale = useLocale();
  const [data, setData] = useState<FavoritesPayload | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/favorites")
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.summary) setData(payload as FavoritesPayload);
      })
      .catch(() => undefined);
  }, []);

  if (!data) {
    return (
      <Card className="admin-desk-table-card p-8 text-center" variant="flat">
        <p className="text-sm text-muted">جاري تحميل المفضلة...</p>
      </Card>
    );
  }

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          إعلانات محفوظة في المفضلة — تابع الشعبية ومن يحفظ ماذا.
        </p>
      </div>

      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">إجمالي الحفظ</p>
          <p className="admin-ops__kpi-value">{data.summary.total}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">إعلانات</p>
          <p className="admin-ops__kpi-value">{data.summary.uniqueListings}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">مستخدمون</p>
          <p className="admin-ops__kpi-value">{data.summary.uniqueUsers}</p>
        </div>
      </div>

      <section className="admin-ops__panel">
        <h2 className="admin-ops__panel-title">الأكثر إضافة للمفضلة</h2>
        <div
          className="admin-ops__detail-grid"
          style={{ marginTop: "0.75rem" }}
        >
          {data.topListings.length === 0 ? (
            <p className="text-sm text-muted">لا بيانات بعد.</p>
          ) : (
            data.topListings.map((row) => (
              <div key={row.listingId} className="admin-ops__detail-row">
                <span>{row.listingId}</span>
                <strong>{row.count}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الإعلان</th>
                <th>المستخدم</th>
                <th>تاريخ الحفظ</th>
              </tr>
            </thead>
            <tbody>
              {data.favorites.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={3}>
                    لا توجد عناصر مفضلة بعد.
                  </td>
                </tr>
              ) : (
                data.favorites.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-desk-cell-wrap">
                      <p className="admin-desk-cell-title">
                        {item.title || item.listingId}
                      </p>
                    </td>
                    <td className="font-mono text-xs">{item.userId}</td>
                    <td className="text-xs text-muted">
                      {new Date(item.savedAt).toLocaleString(intlLocale(locale))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="admin-desk-mobile-list">
          {data.favorites.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لا توجد عناصر مفضلة بعد.</p>
            </li>
          ) : (
            data.favorites.map((item) => (
              <li key={item.id} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                    {item.title || item.listingId}
                  </p>
                </div>
                <div className="admin-desk-mobile-card__meta">
                  <span>{item.userId}</span>
                  <span>
                    {new Date(item.savedAt).toLocaleString(intlLocale(locale))}
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
