"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

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
import { humanDisplayLabel } from "@/shared/display/technical-id";
import { listingDetailsHref } from "@/shared/listings/listing-url";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";

type ReportRow = ListingReport & {
  listingHref?: string;
  sellerHref?: string;
};

function reportListingHref(item: ReportRow): string {
  return (
    item.listingHref ||
    listingDetailsHref({ id: item.listingId, slug: item.listingSlug }) ||
    "/search"
  );
}

function reportSellerHref(item: ReportRow): string | undefined {
  return item.sellerHref;
}

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
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = parseFilter(searchParams.get("status"));
  const [items, setItems] = useState<ReportRow[]>([]);
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
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          بلاغات الإعلانات — راجع السبب واتخذ إجراءً على الإعلان أو المستخدم.
        </p>
        <div className="admin-desk-toolbar__actions">
          <Button href="/admin/listings" size="sm" variant="secondary">
            الإعلانات
          </Button>
          <Button href="/admin/users" size="sm" variant="ghost">
            المستخدمون
          </Button>
        </div>
      </div>

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
            {filtered.length} بلاغ ظاهر
          </p>
        </div>
      </Card>

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الإعلان</th>
                <th>السبب</th>
                <th>المُبلِغ</th>
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
                      ? "لا توجد بلاغات على الإعلانات بعد."
                      : "لا بلاغات لهذه التصفية."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const listingHref = reportListingHref(item);
                  const expanded = expandedId === item.id;
                  const isOpen = item.status === "open";
                  return (
                    <tr key={item.id}>
                      <td className="admin-desk-cell-wrap">
                        <p className="admin-desk-cell-title">
                          <Link className="hover:underline" href={listingHref}>
                            {humanDisplayLabel(item.listingTitle, "إعلان")}
                          </Link>
                        </p>
                        <p className="text-xs text-muted">
                          البائع:{" "}
                          {reportSellerHref(item) ? (
                            <Link
                              className="admin-ops__text-link hover:underline"
                              href={reportSellerHref(item) ?? "/admin/users"}
                            >
                              {humanDisplayLabel(item.sellerName, "—")}
                            </Link>
                          ) : (
                            humanDisplayLabel(item.sellerName, "—")
                          )}
                        </p>
                        {(item.listingRejected || item.sellerSuspended) && (
                          <p className="text-xs text-muted">
                            {item.listingRejected ? "الإعلان مخفي/مرفوض" : null}
                            {item.listingRejected && item.sellerSuspended
                              ? " · "
                              : null}
                            {item.sellerSuspended ? "البائع موقوف" : null}
                          </p>
                        )}
                        {item.resolutionNote ? (
                          <p className="text-xs text-muted">
                            قرار المشغّل: {item.resolutionNote}
                            {item.resolvedByName
                              ? ` — ${item.resolvedByName}`
                              : ""}
                          </p>
                        ) : null}
                        {isOpen && expanded ? (
                          <div className="mt-2 grid gap-2">
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
                                    successText:
                                      "تم رفض الإعلان وإغلاق البلاغ.",
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
                                      successText:
                                        "تم رفض الإعلان وإيقاف البائع.",
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
                      </td>
                      <td className="admin-desk-cell-wrap text-xs">
                        {LISTING_REPORT_REASON_LABELS[item.reason]}
                        {item.details ? ` — ${item.details}` : ""}
                      </td>
                      <td className="admin-desk-cell-wrap text-xs">
                        {item.reporterName}
                        {item.guest ? " (زائر)" : " (مسجّل)"}
                        <br />
                        <a
                          className="text-primary hover:underline"
                          href={`mailto:${item.reporterEmail}`}
                        >
                          {item.reporterEmail}
                        </a>
                        {" · "}
                        <a
                          className="text-primary hover:underline"
                          dir="ltr"
                          href={toTelHref(item.reporterPhone)}
                        >
                          {item.reporterPhone}
                        </a>
                      </td>
                      <td>
                        <Badge variant={statusBadgeVariant(item.status)}>
                          {LISTING_REPORT_STATUS_LABELS[item.status] ??
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
                            href={listingHref}
                            size="sm"
                            variant="secondary"
                          >
                            فتح الإعلان
                          </Button>
                          {reportSellerHref(item) ? (
                            <Button
                              href={reportSellerHref(item)}
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
                  ? "لا توجد بلاغات على الإعلانات بعد."
                  : "لا بلاغات لهذه التصفية."}
              </p>
            </li>
          ) : (
            filtered.map((item) => {
              const listingHref = reportListingHref(item);
              const expanded = expandedId === item.id;
              const isOpen = item.status === "open";
              return (
                <li key={item.id} className="admin-desk-mobile-card">
                  <div className="admin-desk-mobile-card__head">
                    <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                      <Link className="hover:underline" href={listingHref}>
                        {humanDisplayLabel(item.listingTitle, "إعلان")}
                      </Link>
                    </p>
                    <Badge variant={statusBadgeVariant(item.status)}>
                      {LISTING_REPORT_STATUS_LABELS[item.status] ??
                        item.status}
                    </Badge>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>
                      السبب: {LISTING_REPORT_REASON_LABELS[item.reason]}
                      {item.details ? ` — ${item.details}` : ""}
                    </span>
                    <span>
                      المُبلِغ: {item.reporterName}
                      {item.guest ? " (زائر)" : " (مسجّل)"}
                    </span>
                    <span>
                      <a href={`mailto:${item.reporterEmail}`}>
                        {item.reporterEmail}
                      </a>
                      {" · "}
                      <a dir="ltr" href={toTelHref(item.reporterPhone)}>
                        {item.reporterPhone}
                      </a>
                      {" · "}
                      <a
                        href={toWhatsAppHref(item.reporterPhone)}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        واتساب
                      </a>
                    </span>
                    <span>
                      البائع:{" "}
                      {reportSellerHref(item) ? (
                        <Link
                          className="admin-ops__text-link hover:underline"
                          href={reportSellerHref(item) ?? "/admin/users"}
                        >
                          {humanDisplayLabel(item.sellerName, "—")}
                        </Link>
                      ) : (
                        humanDisplayLabel(item.sellerName, "—")
                      )}
                    </span>
                    <span>
                      {new Date(item.createdAt).toLocaleString(
                        intlLocale(locale),
                      )}
                    </span>
                  </div>
                  {item.resolutionNote ? (
                    <p className="text-xs text-muted">
                      قرار المشغّل: {item.resolutionNote}
                      {item.resolvedByName ? ` — ${item.resolvedByName}` : ""}
                    </p>
                  ) : null}
                  <div className="admin-desk-mobile-card__actions">
                    <Button href={listingHref} size="sm" variant="secondary">
                      فتح الإعلان
                    </Button>
                    {reportSellerHref(item) ? (
                      <Button
                        href={reportSellerHref(item)}
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
            })
          )}
        </ul>
      </Card>

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
