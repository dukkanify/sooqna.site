"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useState } from "react";
import type { AdminAuditEntry } from "@/services/admin/admin-audit-store";
import { getSessionUser } from "@/services/storage";
import { Card } from "@/shared/ui/Card";

export function AdminAuditPanel() {
  const locale = useLocale();
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/audit")
      .then((res) => res.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          سجل تدقيق الإجراءات الإدارية — تحرير، استرداد، وتحديث الحالات.
        </p>
      </div>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الإجراء</th>
                <th>الهدف</th>
                <th>المنفّذ</th>
                <th>التفاصيل</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={5}>
                    لا توجد عمليات مسجّلة بعد. ستظهر هنا إجراءات التحرير
                    والاسترداد وتحديث الحالات.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="admin-desk-cell-wrap">
                      <p className="admin-desk-cell-title">{entry.action}</p>
                    </td>
                    <td className="font-mono text-xs">
                      {entry.targetType}/{entry.targetId}
                    </td>
                    <td>{entry.actorName}</td>
                    <td className="admin-desk-cell-wrap text-xs text-muted">
                      {entry.detail || "—"}
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(entry.createdAt).toLocaleString(
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
          {entries.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">
                لا توجد عمليات مسجّلة بعد. ستظهر هنا إجراءات التحرير والاسترداد
                وتحديث الحالات.
              </p>
            </li>
          ) : (
            entries.map((entry) => (
              <li key={entry.id} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                    {entry.action}
                  </p>
                  <span className="text-xs text-muted">
                    {new Date(entry.createdAt).toLocaleString(
                      intlLocale(locale),
                    )}
                  </span>
                </div>
                <div className="admin-desk-mobile-card__meta">
                  <span>
                    {entry.targetType}/{entry.targetId}
                  </span>
                  <span>{entry.actorName}</span>
                </div>
                {entry.detail ? (
                  <p className="text-xs text-muted">{entry.detail}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
