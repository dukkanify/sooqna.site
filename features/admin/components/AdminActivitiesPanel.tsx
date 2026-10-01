"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/features/admin/lib/admin-fetch";
import type { ActivityKind, ActivityRecord } from "@/types/domain/activity";
import { activityKindLabel } from "@/services/activity/activity-labels";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";
import { getSessionUser } from "@/services/storage";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

export function AdminActivitiesPanel() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ActivityRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [kind, setKind] = useState(searchParams.get("kind") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (kind) params.set("kind", kind);
      if (status.trim()) params.set("status", status.trim());
      params.set("page", String(page));
      params.set("pageSize", "25");
      const response = await adminFetch(`/api/admin/activities?${params.toString()}`);
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } finally {
      setLoading(false);
    }
  }, [kind, page, query, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return (
    <LocalizedTree>
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          نشاط المنصة الموحّد — طلبات توظيف، معاينات، عروض أسعار، وطلبات.
        </p>
      </div>

      <Card className="admin-desk-filters p-4" variant="flat">
        <div className="admin-desk-filters__grid">
          <Input
            label="بحث"
            name="query"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          />
          <Select
            label="النوع"
            name="kind"
            onChange={(event) => {
              setKind(event.target.value);
              setPage(1);
            }}
            options={[
              { label: "الكل", value: "" },
              ...(
                [
                  "job_application",
                  "viewing_booking",
                  "quote_request",
                  "service_booking",
                  "order",
                  "listing",
                  "dispute",
                ] as ActivityKind[]
              ).map((value) => ({ label: activityKindLabel(value), value })),
            ]}
            value={kind}
          />
          <Input
            label="الحالة"
            name="status"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          />
          <div className="flex items-end">
            <Button onClick={() => void load()} type="button" variant="accent">
              تطبيق
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="admin-desk-table-card p-8 text-center" variant="flat">
          <p className="text-sm text-muted">جاري التحميل...</p>
        </Card>
      ) : (
        <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
          <div className="admin-desk-table-scroll">
            <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>النوع</th>
                  <th>الحالة</th>
                  <th>التحديث</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="text-muted" colSpan={5}>
                      لا توجد أنشطة مطابقة.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={`${item.kind}-${item.id}`}>
                      <td className="admin-desk-cell-wrap">
                        <p className="admin-desk-cell-title">{item.title}</p>
                        {item.subtitle ? (
                          <p className="text-xs text-muted">{item.subtitle}</p>
                        ) : null}
                      </td>
                      <td>{activityKindLabel(item.kind)}</td>
                      <td>
                        <span className="admin-ops__status-chip">
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(item.updatedAt).toLocaleString(
                          intlLocale(locale),
                        )}
                      </td>
                      <td>
                        <Link
                          className="text-xs font-semibold text-primary hover:underline"
                          href={item.href}
                        >
                          فتح
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ul className="admin-desk-mobile-list">
            {items.length === 0 ? (
              <li className="admin-desk-mobile-card">
                <p className="text-sm text-muted">لا توجد أنشطة مطابقة.</p>
              </li>
            ) : (
              items.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="admin-desk-mobile-card"
                >
                  <div className="admin-desk-mobile-card__head">
                    <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                      {item.title}
                    </p>
                    <span className="admin-ops__status-chip">
                      {item.statusLabel}
                    </span>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>{activityKindLabel(item.kind)}</span>
                    <span>
                      {new Date(item.updatedAt).toLocaleString(
                        intlLocale(locale),
                      )}
                    </span>
                  </div>
                  {item.subtitle ? (
                    <p className="text-xs text-muted">{item.subtitle}</p>
                  ) : null}
                  <div className="admin-desk-mobile-card__actions">
                    <Button href={item.href} size="sm" variant="secondary">
                      فتح
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {total.toLocaleString(intlLocale(locale))} نشاط
        </span>
        <div className="flex gap-2">
          <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} size="sm" type="button" variant="secondary">
            السابق
          </Button>
          <Button
            disabled={page * 25 >= total}
            onClick={() => setPage((p) => p + 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
    </LocalizedTree>
  );
}
