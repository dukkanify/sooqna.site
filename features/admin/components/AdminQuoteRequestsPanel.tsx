"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useState } from "react";
import type { QuoteRequest } from "@/types/domain/quote-request";
import { quoteStatusLabel } from "@/services/activity/activity-labels";
import { getSessionUser } from "@/services/storage";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

const ADMIN_ACTIONS: Partial<
  Record<QuoteRequest["status"], { value: QuoteRequest["status"]; label: string }[]>
> = {
  submitted: [
    { value: "quoted", label: "إرسال عرض" },
    { value: "rejected", label: "رفض" },
  ],
  quoted: [
    { value: "accepted", label: "قبول" },
    { value: "rejected", label: "رفض" },
  ],
  accepted: [{ value: "completed", label: "إكمال" }],
  rejected: [{ value: "quoted", label: "إعادة عرض" }],
  completed: [{ value: "accepted", label: "إعادة فتح" }],
};

function statusChipClass(status: QuoteRequest["status"]): string {
  if (status === "accepted" || status === "completed") {
    return " admin-ops__status-chip--ok";
  }
  if (status === "quoted" || status === "rejected") {
    return " admin-ops__status-chip--warn";
  }
  return "";
}

export function AdminQuoteRequestsPanel() {
  const [items, setItems] = useState<QuoteRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/quote-requests")
      .then((res) => res.json())
      .then((data) => setItems(data.quoteRequests ?? []))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function patchStatus(id: string, status: QuoteRequest["status"]) {
    const user = getSessionUser();
    if (!user) return;
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/quote-requests/${id}`, {
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
      if (res.ok && data.quoteRequest) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.quoteRequest : item)),
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
          طلبات عروض الأسعار للخدمات — أرسل عرضاً أو حدّث الحالة.
        </p>
      </div>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الخدمة</th>
                <th>الطالب</th>
                <th>الموقع / الموعد</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={5}>
                    لا توجد طلبات عروض أسعار.
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
                        <p className="text-xs text-muted">
                          {item.serviceRequired}
                        </p>
                      </td>
                      <td className="text-xs">
                        {item.requesterName} · {item.phone}
                      </td>
                      <td className="text-xs">
                        {item.emirate} / {item.area} · {item.preferredDate}{" "}
                        {item.preferredTime}
                      </td>
                      <td>
                        <span
                          className={`admin-ops__status-chip${statusChipClass(item.status)}`}
                        >
                          {quoteStatusLabel(item.status)}
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
                                action.value === "rejected" ? "ghost" : "secondary"
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
              <p className="text-sm text-muted">لا توجد طلبات عروض أسعار.</p>
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
                      {quoteStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>
                      {item.requesterName} · {item.phone}
                    </span>
                    <span>{item.serviceRequired}</span>
                    <span>
                      {item.emirate} / {item.area} · {item.preferredDate}{" "}
                      {item.preferredTime}
                    </span>
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
                            action.value === "rejected" ? "ghost" : "secondary"
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
