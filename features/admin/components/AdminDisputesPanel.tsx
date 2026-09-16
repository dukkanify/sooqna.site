"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminDisputeRecord, DisputeStatus } from "@/types";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Icon } from "@/shared/ui/Icon";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";

const statusLabels: Record<DisputeStatus, string> = {
  open: "مفتوح",
  under_review: "قيد المراجعة",
  needs_buyer_info: "بانتظار المشتري",
  needs_seller_info: "بانتظار البائع",
  resolved_buyer: "لصالح المشتري",
  resolved_seller: "لصالح البائع",
  partial_resolution: "حل جزئي",
  closed: "مغلق",
};

const filterOptions = [
  { label: "النزاعات المفتوحة", value: "openish" },
  { label: "الكل", value: "all" },
  { label: statusLabels.open, value: "open" },
  { label: statusLabels.under_review, value: "under_review" },
  { label: statusLabels.needs_buyer_info, value: "needs_buyer_info" },
  { label: statusLabels.needs_seller_info, value: "needs_seller_info" },
  { label: statusLabels.resolved_buyer, value: "resolved_buyer" },
  { label: statusLabels.resolved_seller, value: "resolved_seller" },
  { label: statusLabels.partial_resolution, value: "partial_resolution" },
  { label: statusLabels.closed, value: "closed" },
];

const OPENISH: DisputeStatus[] = [
  "open",
  "under_review",
  "needs_buyer_info",
  "needs_seller_info",
];

function disputeBadgeVariant(
  status: DisputeStatus,
): "pending" | "verified" | "rejected" | "muted" | "escrow" {
  if (status === "open") return "pending";
  if (
    status === "under_review" ||
    status === "needs_buyer_info" ||
    status === "needs_seller_info"
  ) {
    return "escrow";
  }
  if (status === "resolved_buyer" || status === "partial_resolution") {
    return "verified";
  }
  if (status === "resolved_seller") return "muted";
  return "rejected";
}

function isActionable(status: DisputeStatus): boolean {
  return OPENISH.includes(status);
}

export function AdminDisputesPanel() {
  const [disputes, setDisputes] = useState<AdminDisputeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("openish");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    variant: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/disputes")
      .then((res) => res.json())
      .then((data) => setDisputes(data.disputes ?? []))
      .catch(() => setDisputes([]));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return disputes;
    if (statusFilter === "openish") {
      return disputes.filter((d) => OPENISH.includes(d.status));
    }
    return disputes.filter((d) => d.status === statusFilter);
  }, [disputes, statusFilter]);

  function noteFor(dispute: AdminDisputeRecord): string {
    return noteDrafts[dispute.id] ?? dispute.resolutionNote ?? "";
  }

  async function patchDispute(
    id: string,
    status: DisputeStatus,
    fallbackNote: string,
  ) {
    const session = getSessionUser();
    if (!session) return;
    const note = (noteDrafts[id] ?? "").trim() || fallbackNote;
    setBusyId(id);
    setMessage(null);
    try {
      const response = await adminFetch(`/api/admin/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolutionNote: note,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({
          variant: "error",
          text:
            data.error === "INVALID_STATUS"
              ? "حالة الطلب لا تسمح بهذا القرار المالي."
              : data.error === "ALREADY_REFUNDED"
                ? "تم استرداد هذا الطلب مسبقاً."
                : data.error === "NOT_HELD"
                  ? "المبلغ غير محتجز في الضمان حالياً."
                  : data.message ?? data.error ?? "تعذر تحديث النزاع.",
        });
        return;
      }
      if (data.dispute) {
        setDisputes((prev) =>
          prev.map((dispute) => (dispute.id === id ? data.dispute : dispute)),
        );
        setNoteDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      const effect =
        data.financialEffect === "refunded"
          ? " · تم الاسترداد"
          : data.financialEffect === "released"
            ? " · تم تحرير الضمان"
            : data.financialEffect === "order_missing"
              ? " · تنبيه: الطلب غير موجود في المخزون"
              : "";
      setMessage({
        variant: "success",
        text: `تم تحديث النزاع إلى «${statusLabels[status]}»${effect}.`,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <FormMessage variant={message.variant}>{message.text}</FormMessage>
      ) : null}

      <Card className="p-4" variant="flat">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <Select
              label="تصفية النزاعات"
              onChange={(event) => setStatusFilter(event.target.value)}
              options={filterOptions}
              value={statusFilter}
            />
          </div>
          <p className="pb-2 text-xs text-muted">
            <Icon className="ms-1 inline" name="shield" size={14} />
            {filtered.length} نزاع · اكتب ملاحظة القرار قبل الحكم
          </p>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">لا توجد نزاعات مطابقة.</p>
        </Card>
      ) : (
        <div className="admin-boxes__grid">
          {filtered.map((dispute) => {
            const openDesk = expandedId === dispute.id;
            const actionable = isActionable(dispute.status);
            return (
              <Card
                key={dispute.id}
                className={`p-5${openDesk ? " admin-boxes__card--wide" : ""}`}
                variant="flat"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {dispute.listingTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted" dir="ltr">
                      {dispute.orderId}
                    </p>
                    <p className="mt-2 text-sm">
                      {dispute.buyerName} → {dispute.sellerName}
                    </p>
                    <p className="mt-2 text-sm text-muted">{dispute.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={disputeBadgeVariant(dispute.status)}>
                        {statusLabels[dispute.status]}
                      </Badge>
                    </div>
                    {dispute.resolutionNote ? (
                      <p className="mt-2 text-xs text-muted">
                        آخر قرار: {dispute.resolutionNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-start">
                    <CurrencyAmount amount={dispute.amount} size="lg" />
                    <p className="mt-1 text-xs text-muted">
                      {new Date(dispute.createdAt).toLocaleString("ar-AE")}
                    </p>
                  </div>
                </div>

                {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-ink">الأدلة</p>
                    <ul className="mt-1 grid gap-1">
                      {dispute.evidenceUrls.map((url) => (
                        <li key={url}>
                          <a
                            className="break-all text-xs font-semibold text-primary"
                            href={url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted">لا توجد روابط أدلة.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    href="/admin/orders"
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    الطلبات
                  </Button>
                  <Button
                    href="/admin/escrow"
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    الضمان
                  </Button>
                  {actionable ? (
                    <Button
                      aria-expanded={openDesk}
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === dispute.id ? null : dispute.id,
                        )
                      }
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {openDesk ? "إخفاء المكتب" : "مكتب القرار"}
                    </Button>
                  ) : null}
                </div>

                {actionable && openDesk ? (
                  <div className="mt-4 grid gap-3 border-t border-border/70 pt-3">
                    <Textarea
                      label="ملاحظة القرار"
                      onChange={(event) =>
                        setNoteDrafts((prev) => ({
                          ...prev,
                          [dispute.id]: event.target.value,
                        }))
                      }
                      placeholder="اكتب سبب القرار أو طلب المعلومات…"
                      rows={3}
                      value={noteFor(dispute)}
                    />

                    <div className="flex flex-wrap gap-2">
                      {dispute.status === "open" ? (
                        <Button
                          loading={busyId === dispute.id}
                          onClick={() =>
                            void patchDispute(
                              dispute.id,
                              "under_review",
                              "بدأ فريق سوقنا مراجعة النزاع.",
                            )
                          }
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          بدء المراجعة
                        </Button>
                      ) : null}
                      <Button
                        loading={busyId === dispute.id}
                        onClick={() =>
                          void patchDispute(
                            dispute.id,
                            "needs_buyer_info",
                            "نحتاج معلومات إضافية من المشتري.",
                          )
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        طلب من المشتري
                      </Button>
                      <Button
                        loading={busyId === dispute.id}
                        onClick={() =>
                          void patchDispute(
                            dispute.id,
                            "needs_seller_info",
                            "نحتاج معلومات إضافية من البائع.",
                          )
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        طلب من البائع
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        loading={busyId === dispute.id}
                        onClick={() =>
                          void patchDispute(
                            dispute.id,
                            "resolved_buyer",
                            "تم الحكم لصالح المشتري واسترداد المبلغ.",
                          )
                        }
                        size="sm"
                        type="button"
                        variant="primary"
                      >
                        لصالح المشتري
                      </Button>
                      <Button
                        loading={busyId === dispute.id}
                        onClick={() =>
                          void patchDispute(
                            dispute.id,
                            "resolved_seller",
                            "تم الحكم لصالح البائع وتحرير الضمان.",
                          )
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        لصالح البائع
                      </Button>
                      <Button
                        loading={busyId === dispute.id}
                        onClick={() =>
                          void patchDispute(
                            dispute.id,
                            "partial_resolution",
                            "حل جزئي — راجع الضمان/الاسترداد يدوياً إن لزم.",
                          )
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        حل جزئي
                      </Button>
                      <Button
                        loading={busyId === dispute.id}
                        onClick={() =>
                          void patchDispute(
                            dispute.id,
                            "closed",
                            "تم إغلاق النزاع.",
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
              </Card>
            );
          })}
        </div>
      )}

      <Link className="text-sm font-semibold text-primary" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}
