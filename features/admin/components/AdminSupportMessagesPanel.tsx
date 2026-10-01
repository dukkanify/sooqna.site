"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";
import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  SupportMessage,
  SupportMessageStatus,
} from "@/types/domain/support-message";
import {
  SUPPORT_MESSAGE_STATUS_LABELS,
  SUPPORT_TOPIC_LABELS,
} from "@/types/domain/support-message";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";

type StatusFilter = "open" | "all" | SupportMessageStatus;

const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: "الجديدة", value: "open" },
  { label: "الكل", value: "all" },
  { label: SUPPORT_MESSAGE_STATUS_LABELS.reviewed, value: "reviewed" },
  { label: SUPPORT_MESSAGE_STATUS_LABELS.resolved, value: "resolved" },
  { label: SUPPORT_MESSAGE_STATUS_LABELS.dismissed, value: "dismissed" },
];

function parseFilter(raw: string | null): StatusFilter {
  const allowed = new Set(filterOptions.map((o) => o.value));
  if (raw && allowed.has(raw as StatusFilter)) return raw as StatusFilter;
  return "open";
}

function statusBadgeVariant(
  status: SupportMessageStatus,
): "pending" | "verified" | "rejected" | "muted" | "escrow" {
  if (status === "open") return "pending";
  if (status === "resolved") return "verified";
  if (status === "dismissed") return "muted";
  return "escrow";
}

export function AdminSupportMessagesPanel() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = parseFilter(searchParams.get("status"));
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    text: string;
    variant: "success" | "error";
  } | null>(null);

  function setStatusFilter(next: StatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "open") params.delete("status");
    else params.set("status", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function load() {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/support-messages")
      .then((res) => res.json())
      .then((data) => setItems(data.messages ?? []))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  async function updateStatus(
    id: string,
    status: SupportMessageStatus,
    confirmText: string,
    successText: string,
  ) {
    const user = getSessionUser();
    if (!user) return;
    if (!window.confirm(confirmText)) return;

    setBusyId(id);
    setMessage(null);
    try {
      const res = await adminFetch(`/api/admin/support-messages/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          resolutionNote: (noteDrafts[id] ?? "").trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          variant: "error",
          text: data.error ?? "تعذّر تحديث الرسالة.",
        });
        return;
      }
      if (data.message) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.message : item)),
        );
        setExpandedId(null);
      }
      setMessage({ variant: "success", text: successText });
    } finally {
      setBusyId(null);
    }
  }

  const openCount = items.filter((item) => item.status === "open").length;

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          رسائل «تواصل معنا» — ردّ، أغلق، وتابع الحالات المفتوحة.
        </p>
      </div>

      {message ? (
        <FormMessage variant={message.variant}>{message.text}</FormMessage>
      ) : null}

      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">كل الرسائل</p>
          <p className="admin-ops__kpi-value">{items.length}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">جديدة</p>
          <p className="admin-ops__kpi-value">{openCount}</p>
        </div>
      </div>

      <Card className="admin-desk-filters p-4" variant="flat">
        <div className="admin-desk-filters__grid">
          <div className="min-w-[11rem]">
            <Select
              label="التصفية"
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              options={filterOptions}
              value={statusFilter}
            />
          </div>
          <p className="pb-2 text-xs font-semibold text-muted">
            {filtered.length} رسالة ظاهرة
          </p>
        </div>
      </Card>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>المرسل</th>
                <th>الموضوع</th>
                <th>الرسالة</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={6}>
                    {items.length === 0
                      ? "لا رسائل من نموذج تواصل معنا بعد."
                      : "لا رسائل لهذه التصفية."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const expanded = expandedId === item.id;
                  const isOpen = item.status === "open";
                  return (
                    <tr key={item.id}>
                      <td className="admin-desk-cell-wrap">
                        <p className="admin-desk-cell-title">{item.name}</p>
                        <a
                          className="text-xs text-primary hover:underline"
                          href={`mailto:${item.email}`}
                        >
                          {item.email}
                        </a>
                      </td>
                      <td className="text-xs">
                        {SUPPORT_TOPIC_LABELS[item.topic]}
                      </td>
                      <td className="admin-desk-cell-wrap text-xs whitespace-pre-wrap">
                        {item.message}
                        {item.resolutionNote ? (
                          <p className="mt-1 text-muted">
                            قرار المشغّل: {item.resolutionNote}
                            {item.resolvedByName
                              ? ` — ${item.resolvedByName}`
                              : ""}
                          </p>
                        ) : null}
                        {isOpen && expanded ? (
                          <div className="mt-2 grid gap-2">
                            <Textarea
                              label="ملاحظة القرار"
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="مثال: تم الرد عبر البريد…"
                              rows={2}
                              value={noteDrafts[item.id] ?? ""}
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                disabled={busyId === item.id}
                                loading={busyId === item.id}
                                onClick={() =>
                                  void updateStatus(
                                    item.id,
                                    "resolved",
                                    "تأكيد تعليم الرسالة كمُجاب عليها؟",
                                    "تم تعليم الرسالة كمجاب عليها.",
                                  )
                                }
                                size="sm"
                                type="button"
                              >
                                تم الرد
                              </Button>
                              <Button
                                disabled={busyId === item.id}
                                onClick={() =>
                                  void updateStatus(
                                    item.id,
                                    "reviewed",
                                    "تأكيد تعليم الرسالة كمراجعة؟",
                                    "تمت مراجعة الرسالة.",
                                  )
                                }
                                size="sm"
                                type="button"
                                variant="secondary"
                              >
                                تمت المراجعة
                              </Button>
                              <Button
                                disabled={busyId === item.id}
                                onClick={() =>
                                  void updateStatus(
                                    item.id,
                                    "dismissed",
                                    "تأكيد إغلاق الرسالة بدون إجراء؟",
                                    "أُغلقت الرسالة.",
                                  )
                                }
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                إغلاق
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <Badge variant={statusBadgeVariant(item.status)}>
                          {SUPPORT_MESSAGE_STATUS_LABELS[item.status] ??
                            item.status}
                        </Badge>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(item.createdAt).toLocaleString(
                          intlLocale(locale),
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            href={`mailto:${item.email}`}
                            size="sm"
                            variant="secondary"
                          >
                            رد بالبريد
                          </Button>
                          {isOpen ? (
                            <Button
                              onClick={() =>
                                setExpandedId(expanded ? null : item.id)
                              }
                              size="sm"
                              type="button"
                            >
                              {expanded ? "إخفاء الإجراءات" : "معالجة"}
                            </Button>
                          ) : null}
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
          {filtered.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">
                {items.length === 0
                  ? "لا رسائل من نموذج تواصل معنا بعد."
                  : "لا رسائل لهذه التصفية."}
              </p>
            </li>
          ) : (
            filtered.map((item) => {
              const expanded = expandedId === item.id;
              const isOpen = item.status === "open";
              return (
                <li key={item.id} className="admin-desk-mobile-card">
                  <div className="admin-desk-mobile-card__head">
                    <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                      {item.name}
                    </p>
                    <Badge variant={statusBadgeVariant(item.status)}>
                      {SUPPORT_MESSAGE_STATUS_LABELS[item.status] ??
                        item.status}
                    </Badge>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>{SUPPORT_TOPIC_LABELS[item.topic]}</span>
                    <span dir="ltr">{item.email}</span>
                    <span>
                      {new Date(item.createdAt).toLocaleString(
                        intlLocale(locale),
                      )}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-muted">
                    {item.message}
                  </p>
                  {item.resolutionNote ? (
                    <p className="text-xs text-muted">
                      قرار المشغّل: {item.resolutionNote}
                      {item.resolvedByName ? ` — ${item.resolvedByName}` : ""}
                    </p>
                  ) : null}
                  <div className="admin-desk-mobile-card__actions">
                    <Button
                      href={`mailto:${item.email}`}
                      size="sm"
                      variant="secondary"
                    >
                      رد بالبريد
                    </Button>
                    {isOpen ? (
                      <Button
                        onClick={() =>
                          setExpandedId(expanded ? null : item.id)
                        }
                        size="sm"
                        type="button"
                      >
                        {expanded ? "إخفاء الإجراءات" : "معالجة"}
                      </Button>
                    ) : null}
                  </div>
                  {isOpen && expanded ? (
                    <div className="mt-3 grid gap-2">
                      <Textarea
                        label="ملاحظة القرار"
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="مثال: تم الرد عبر البريد…"
                        rows={2}
                        value={noteDrafts[item.id] ?? ""}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={busyId === item.id}
                          loading={busyId === item.id}
                          onClick={() =>
                            void updateStatus(
                              item.id,
                              "resolved",
                              "تأكيد تعليم الرسالة كمُجاب عليها؟",
                              "تم تعليم الرسالة كمجاب عليها.",
                            )
                          }
                          size="sm"
                          type="button"
                        >
                          تم الرد
                        </Button>
                        <Button
                          disabled={busyId === item.id}
                          onClick={() =>
                            void updateStatus(
                              item.id,
                              "reviewed",
                              "تأكيد تعليم الرسالة كمراجعة؟",
                              "تمت مراجعة الرسالة.",
                            )
                          }
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          تمت المراجعة
                        </Button>
                        <Button
                          disabled={busyId === item.id}
                          onClick={() =>
                            void updateStatus(
                              item.id,
                              "dismissed",
                              "تأكيد إغلاق الرسالة بدون إجراء؟",
                              "أُغلقت الرسالة.",
                            )
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          إغلاق
                        </Button>
                      </div>
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
