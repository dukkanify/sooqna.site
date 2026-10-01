"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useState } from "react";
import type { DeliveryAddress } from "@/types/domain/address";
import { getSessionUser } from "@/services/storage";
import { Card } from "@/shared/ui/Card";

export function AdminAddressesPanel() {
  const [items, setItems] = useState<DeliveryAddress[]>([]);
  const [summary, setSummary] = useState({ total: 0, users: 0 });

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/addresses")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.addresses ?? []);
        if (data.summary) setSummary(data.summary);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          عناوين التوصيل المحفوظة للمستخدمين — راجع الإمارة والمدينة والتواصل.
        </p>
      </div>

      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">العناوين</p>
          <p className="admin-ops__kpi-value">{summary.total}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">المستخدمون</p>
          <p className="admin-ops__kpi-value">{summary.users}</p>
        </div>
      </div>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الموقع</th>
                <th>المستخدم</th>
                <th>الهاتف</th>
                <th>افتراضي</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={5}>
                    لا توجد عناوين توصيل محفوظة بعد.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-desk-cell-wrap">
                      <p className="admin-desk-cell-title">
                        {item.label} — {item.fullName}
                      </p>
                      <p className="text-xs text-muted">{item.street}</p>
                    </td>
                    <td className="text-xs">
                      {item.emirate} / {item.city} / {item.area}
                    </td>
                    <td className="font-mono text-xs">{item.userId}</td>
                    <td dir="ltr">{item.phone}</td>
                    <td>{item.isDefault ? "نعم" : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="admin-desk-mobile-list">
          {items.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">
                لا توجد عناوين توصيل محفوظة بعد.
              </p>
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                    {item.label} — {item.fullName}
                  </p>
                  {item.isDefault ? (
                    <span className="admin-ops__status-chip admin-ops__status-chip--ok">
                      افتراضي
                    </span>
                  ) : null}
                </div>
                <div className="admin-desk-mobile-card__meta">
                  <span>
                    {item.emirate} / {item.city} / {item.area}
                  </span>
                  <span>{item.street}</span>
                  <span>{item.userId}</span>
                  <span dir="ltr">{item.phone}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
