"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useState } from "react";
import type { JobApplication } from "@/types/domain/job-application";
import { jobStatusLabel } from "@/services/activity/activity-labels";
import { getSessionUser } from "@/services/storage";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

const ADMIN_ACTIONS: Partial<
  Record<JobApplication["status"], { value: JobApplication["status"]; label: string }[]>
> = {
  submitted: [
    { value: "viewed", label: "تمت المشاهدة" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "accepted", label: "مقبول" },
    { value: "rejected", label: "مرفوض" },
  ],
  viewed: [
    { value: "shortlisted", label: "Shortlisted" },
    { value: "accepted", label: "مقبول" },
    { value: "rejected", label: "مرفوض" },
  ],
  reviewed: [
    { value: "shortlisted", label: "Shortlisted" },
    { value: "accepted", label: "مقبول" },
    { value: "rejected", label: "مرفوض" },
  ],
  shortlisted: [
    { value: "accepted", label: "مقبول" },
    { value: "rejected", label: "مرفوض" },
  ],
};

function statusChipClass(status: JobApplication["status"]): string {
  if (status === "accepted" || status === "shortlisted") {
    return " admin-ops__status-chip--ok";
  }
  if (status === "rejected") {
    return " admin-ops__status-chip--warn";
  }
  return "";
}

export function AdminJobApplicationsPanel() {
  const locale = useLocale();
  const [items, setItems] = useState<JobApplication[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/job-applications")
      .then((res) => res.json())
      .then((data) => setItems(data.applications ?? []))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function patchStatus(id: string, status: JobApplication["status"]) {
    const user = getSessionUser();
    if (!user) return;
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/job-applications/${id}`, {
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
      if (res.ok && data.application) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.application : item)),
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
          طلبات التوظيف الواردة — راجع المتقدمين وحدّث الحالة مباشرة.
        </p>
      </div>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الوظيفة</th>
                <th>المتقدم</th>
                <th>المدينة / الخبرة</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={6}>
                    لا توجد طلبات توظيف.
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
                      </td>
                      <td className="admin-desk-cell-wrap text-xs">
                        {item.applicantName}
                        <br />
                        {item.applicantEmail} · {item.phone}
                      </td>
                      <td className="text-xs">
                        {item.currentCity} · خبرة {item.yearsOfExperience} سنة
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(item.createdAt).toLocaleString(
                          intlLocale(locale),
                        )}
                      </td>
                      <td>
                        <span
                          className={`admin-ops__status-chip${statusChipClass(item.status)}`}
                        >
                          {jobStatusLabel(item.status)}
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
              <p className="text-sm text-muted">لا توجد طلبات توظيف.</p>
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
                      {jobStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>{item.applicantName}</span>
                    <span>
                      {item.applicantEmail} · {item.phone}
                    </span>
                    <span>
                      {item.currentCity} · خبرة {item.yearsOfExperience} سنة
                    </span>
                    <span>
                      {new Date(item.createdAt).toLocaleString(
                        intlLocale(locale),
                      )}
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
