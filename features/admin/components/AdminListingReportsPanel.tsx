"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  ListingReport,
  ListingReportStatus,
} from "@/types/domain/listing-report";
import {
  LISTING_REPORT_REASON_LABELS,
  LISTING_REPORT_STATUS_LABELS,
} from "@/types/domain/listing-report";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";

function toTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("971")
    ? digits
    : digits.startsWith("0")
      ? `971${digits.slice(1)}`
      : digits.startsWith("5")
        ? `971${digits}`
        : digits;
  return `tel:+${normalized}`;
}

function toWhatsAppHref(phone: string): string {
  const digits = toTelHref(phone).replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

type StatusFilter = "open" | "all" | ListingReportStatus;

const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: "الجديدة", value: "open" },
  { label: "الكل", value: "all" },
  { label: LISTING_REPORT_STATUS_LABELS.dismissed, value: "dismissed" },
  { label: LISTING_REPORT_STATUS_LABELS.resolved, value: "resolved" },
  { label: LISTING_REPORT_STATUS_LABELS.reviewed, value: "reviewed" },
];

function parseFilter(raw: string | null): StatusFilter {
  const allowed = new Set(filterOptions.map((o) => o.value));
  if (raw && allowed.has(raw as StatusFilter)) return raw as StatusFilter;
  return "open";
}

function statusBadgeVariant(
  status: ListingReportStatus,
): "pending" | "verified" | "rejected" | "muted" | "escrow" {
  if (status === "open") return "pending";
  if (status === "resolved") return "rejected";
  if (status === "dismissed") return "muted";
  return "verified";
}

export function AdminListingReportsPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = parseFilter(searchParams.get("status"));
  const [items, setItems] = useState<ListingReport[]>([]);
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
    adminFetch("/api/admin/listing-reports")
      .then((res) => res.json())
      .then((data) => setItems(data.reports ?? []))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  async function resolveReport(
    id: string,
    input: {
      status?: ListingReportStatus;
      rejectListing?: boolean;
      suspendSeller?: boolean;
      confirmText: string;
      successText: string;
    },
  ) {
    const user = getSessionUser();
    if (!user) return;
    const note = (noteDrafts[id] ?? "").trim();
    if (!window.confirm(input.confirmText)) return;

    setBusyId(id);
    setMessage(null);
    try {
      const res = await adminFetch(`/api/admin/listing-reports/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: input.status,
          resolutionNote: note || undefined,
          rejectListing: input.rejectListing,
          rejectReason: note || undefined,
          suspendSeller: input.suspendSeller,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          variant: "error",
          text:
            data.error === "LISTING_NOT_FOUND"
              ? "الإعلان غير موجود."
              : data.error === "SELLER_NOT_FOUND"
                ? "لا يمكن إيقاف البائع — لا يوجد معرف بائع."
                : data.error === "SELLER_UPDATE_FAILED"
                  ? "تعذّر إيقاف حساب البائع."
                  : data.error ?? "تعذّر معالجة البلاغ.",
        });
        return;
      }
      if (data.report) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.report : item)),
        );
        setExpandedId(null);
        setNoteDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      const effects =
        Array.isArray(data.effects) && data.effects.length > 0
          ? ` · ${data.effects.join(" · ")}`
          : "";
      setMessage({
        variant: "success",
        text: `${input.successText}${effects}`,
      });
    } finally {
      setBusyId(null);
    }
  }

  const openCount = items.filter((item) => item.status === "open").length;
  const guestCount = items.filter((item) => item.guest).length;

  return (
    <div className="grid gap-3">
      {message ? (
        <FormMessage variant={message.variant}>{message.text}</FormMessage>
      ) : null}

      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">كل البلاغات</p>
          <p className="admin-ops__kpi-value">{items.length}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">جديدة</p>
          <p className="admin-ops__kpi-value">{openCount}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">من زوار بدون حساب</p>
          <p className="admin-ops__kpi-value">{guestCount}</p>
        </div>
      </div>

      <div className="admin-ops__toolbar flex flex-wrap items-end gap-3">
        <div className="min-w-[11rem]">
          <Select
            label="التصفية"
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            options={filterOptions}
            value={statusFilter}
          />
        </div>
        <p className="pb-2 text-xs text-muted">
          {filtered.length} بلاغ ظاهر
        </p>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">
            {items.length === 0
              ? "لا توجد بلاغات على الإعلانات بعد."
              : "لا بلاغات لهذه التصفية."}
          </p>
        </Card>
      ) : (
        <ul className="admin-boxes__grid">
          {filtered.map((item) => {
            const listingHref = item.listingSlug
              ? `/listings/${item.listingSlug}`
              : `/listings/${item.listingId}`;
            const expanded = expandedId === item.id;
            const isOpen = item.status === "open";
            return (
              <li
                key={item.id}
                className="admin-boxes__card admin-boxes__card--wide"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="admin-ops__queue-label">{item.listingTitle}</p>
                    <p className="admin-ops__queue-meta" dir="ltr">
                      {item.id}
                    </p>
                    <p className="admin-ops__queue-meta">
                      السبب: {LISTING_REPORT_REASON_LABELS[item.reason]}
                      {item.details ? ` — ${item.details}` : ""}
                    </p>
                    <p className="admin-ops__queue-meta">
                      المُبلِغ: {item.reporterName}
                      {item.guest ? " (زائر)" : " (مسجّل)"}
                    </p>
                    <p className="admin-ops__queue-meta">
                      <a
                        className="admin-ops__text-link"
                        href={`mailto:${item.reporterEmail}`}
                      >
                        {item.reporterEmail}
                      </a>
                      {" · "}
                      <a
                        className="admin-ops__text-link"
                        dir="ltr"
                        href={toTelHref(item.reporterPhone)}
                      >
                        {item.reporterPhone}
                      </a>
                      {" · "}
                      <a
                        className="admin-ops__text-link"
                        href={toWhatsAppHref(item.reporterPhone)}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        واتساب
                      </a>
                    </p>
                    <p className="admin-ops__queue-meta">
                      البائع: {item.sellerName ?? "—"}
                      {item.sellerId ? ` · ${item.sellerId}` : ""} ·{" "}
                      {new Date(item.createdAt).toLocaleString("ar-AE")}
                    </p>
                    {item.resolutionNote ? (
                      <p className="admin-ops__queue-meta">
                        قرار المشغّل: {item.resolutionNote}
                        {item.resolvedByName ? ` — ${item.resolvedByName}` : ""}
                      </p>
                    ) : null}
                    {(item.listingRejected || item.sellerSuspended) && (
                      <p className="admin-ops__queue-meta">
                        {item.listingRejected ? "الإعلان مخفي/مرفوض" : null}
                        {item.listingRejected && item.sellerSuspended
                          ? " · "
                          : null}
                        {item.sellerSuspended ? "البائع موقوف" : null}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusBadgeVariant(item.status)}>
                    {LISTING_REPORT_STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </div>

                <div className="admin-boxes__card-actions">
                  <Button href={listingHref} size="sm" variant="secondary">
                    فتح الإعلان
                  </Button>
                  {item.sellerId ? (
                    <Button
                      href={`/admin/users?q=${encodeURIComponent(item.sellerId)}`}
                      size="sm"
                      variant="ghost"
                    >
                      صفحة البائع
                    </Button>
                  ) : null}
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
                      label="ملاحظة القرار (تظهر في السجل)"
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="مثال: تم التحقق — إعلان سليم / محتوى ممنوع…"
                      rows={2}
                      value={noteDrafts[item.id] ?? ""}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={busyId === item.id}
                        loading={busyId === item.id}
                        onClick={() =>
                          void resolveReport(item.id, {
                            status: "dismissed",
                            confirmText:
                              "تأكيد إغلاق البلاغ بدون إجراء على الإعلان؟",
                            successText: "تم إغلاق البلاغ بدون إجراء.",
                          })
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        إغلاق بدون إجراء
                      </Button>
                      <Button
                        disabled={busyId === item.id}
                        loading={busyId === item.id}
                        onClick={() =>
                          void resolveReport(item.id, {
                            status: "resolved",
                            rejectListing: true,
                            confirmText:
                              "إخفاء/رفض الإعلان المبلّغ عنه وإغلاق البلاغ؟",
                            successText: "تم رفض الإعلان وإغلاق البلاغ.",
                          })
                        }
                        size="sm"
                        type="button"
                      >
                        إخفاء الإعلان
                      </Button>
                      {item.sellerId ? (
                        <Button
                          disabled={busyId === item.id}
                          loading={busyId === item.id}
                          onClick={() =>
                            void resolveReport(item.id, {
                              status: "resolved",
                              rejectListing: true,
                              suspendSeller: true,
                              confirmText:
                                "رفض الإعلان وإيقاف حساب البائع؟ هذا إجراء قوي.",
                              successText: "تم رفض الإعلان وإيقاف البائع.",
                            })
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          إخفاء + إيقاف البائع
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="admin-ops__quick-links">
        <Link className="admin-ops__chip-link" href="/admin/listings">
          الإعلانات
        </Link>
        <Link className="admin-ops__chip-link" href="/admin/users">
          المستخدمون
        </Link>
        <Link className="admin-ops__text-link" href="/admin">
          غرفة التحكم
        </Link>
      </div>
    </div>
  );
}
