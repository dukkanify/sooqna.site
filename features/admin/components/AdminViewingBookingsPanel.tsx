"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useState } from "react";
import type { ViewingBooking } from "@/types/domain/viewing-booking";
import { viewingStatusLabel } from "@/services/activity/activity-labels";
import { getSessionUser } from "@/services/storage";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

const ADMIN_ACTIONS: Partial<
  Record<ViewingBooking["status"], { value: ViewingBooking["status"]; label: string }[]>
> = {
  pending: [
    { value: "confirmed", label: "اعتماد" },
    { value: "cancelled", label: "إلغاء" },
  ],
  modification_proposed: [
    { value: "confirmed", label: "اعتماد المقترح" },
    { value: "cancelled", label: "إلغاء" },
  ],
  confirmed: [
    { value: "completed", label: "إكمال" },
    { value: "cancelled", label: "إلغاء" },
  ],
  cancelled: [{ value: "confirmed", label: "إعادة تأكيد" }],
  completed: [{ value: "confirmed", label: "إعادة فتح" }],
};

function statusChipClass(status: ViewingBooking["status"]): string {
  if (status === "confirmed" || status === "completed") {
    return " admin-ops__status-chip--ok";
  }
  if (
    status === "pending" ||
    status === "cancelled" ||
    status === "modification_proposed"
  ) {
    return " admin-ops__status-chip--warn";
  }
  return "";
}

export function AdminViewingBookingsPanel() {
  const [items, setItems] = useState<ViewingBooking[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/viewing-bookings")
      .then((res) => res.json())
      .then((data) => setItems(data.bookings ?? []))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function patchStatus(id: string, status: ViewingBooking["status"]) {
    const user = getSessionUser();
    if (!user) return;
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/viewing-bookings/${id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status,
          actorId: user.id,
          actorName: user.fullName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.booking) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.booking : item)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          حجوزات معاينة العقارات — اعتمد أو عدّل أو أكمل من هنا.
        </p>
      </div>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الإعلان</th>
                <th>الزائر</th>
                <th>الموعد</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={5}>
                    لا توجد حجوزات معاينة.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const actions = ADMIN_ACTIONS[item.status] ?? [];
                  return (
                    <tr key={item.id}>
                      <td className="admin-desk-cell-wrap">
                        <p className="admin-desk-cell-title">
                          {item.listingTitle}
                        </p>
                        {item.notes ? (
                          <p className="text-xs text-muted">{item.notes}</p>
                        ) : null}
                      </td>
                      <td className="text-xs">
                        {item.buyerName} · {item.phone} · {item.visitors} زائر
                      </td>
                      <td className="text-xs">
                        {item.date} — {item.time}
                      </td>
                      <td>
                        <span
                          className={`admin-ops__status-chip${statusChipClass(item.status)}`}
                        >
                          {viewingStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {actions.map((action) => (
                            <Button
                              key={action.value}
                              loading={busyId === item.id}
                              onClick={() => patchStatus(item.id, action.value)}
                              size="sm"
                              type="button"
                              variant={
                                action.value === "cancelled" ? "ghost" : "secondary"
                              }
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <ul className="admin-desk-mobile-list">
          {items.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لا توجد حجوزات معاينة.</p>
            </li>
          ) : (
            items.map((item) => {
              const actions = ADMIN_ACTIONS[item.status] ?? [];
              return (
                <li key={item.id} className="admin-desk-mobile-card">
                  <div className="admin-desk-mobile-card__head">
                    <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                      {item.listingTitle}
                    </p>
                    <span
                      className={`admin-ops__status-chip${statusChipClass(item.status)}`}
                    >
                      {viewingStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>
                      {item.buyerName} · {item.phone} · {item.visitors} زائر
                    </span>
                    <span>
                      {item.date} — {item.time}
                    </span>
                    {item.notes ? <span>{item.notes}</span> : null}
                  </div>
                  {actions.length > 0 ? (
                    <div className="admin-desk-mobile-card__actions">
                      {actions.map((action) => (
                        <Button
                          key={action.value}
                          loading={busyId === item.id}
                          onClick={() => patchStatus(item.id, action.value)}
                          size="sm"
                          type="button"
                          variant={
                            action.value === "cancelled" ? "ghost" : "secondary"
                          }
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </Card>
    </div>
  );
}
