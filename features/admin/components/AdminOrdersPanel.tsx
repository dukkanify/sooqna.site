"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Order } from "@/types";
import {
  escrowStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
  productVerificationStatusLabel,
} from "@/services/activity/activity-labels";
import { orderRequiresProductConditionVerification } from "@/shared/listings/escrow-eligibility";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";

const customerTypeLabels: Record<NonNullable<Order["customerType"]>, string> = {
  registered: "مستخدم مسجّل",
  guest: "ضيف",
  guest_converted: "ضيف — تم تحويله لحساب",
};

type OrderFilter =
  | "all"
  | "held"
  | "pending_payment"
  | "failed"
  | "evidence"
  | "disputed"
  | "refunded";

const filterOptions: { label: string; value: OrderFilter }[] = [
  { label: "الكل", value: "all" },
  { label: "ضمان محجوز", value: "held" },
  { label: "بانتظار الدفع", value: "pending_payment" },
  { label: "دفع فاشل", value: "failed" },
  { label: "توثيق منتج ناقص", value: "evidence" },
  { label: "نزاع", value: "disputed" },
  { label: "مسترد", value: "refunded" },
];

function isHeld(order: Order): boolean {
  return (
    order.escrowStatus === "held" || order.status === "paid_held_in_escrow"
  );
}

function needsEvidence(order: Order): boolean {
  if (!orderRequiresProductConditionVerification(order)) return false;
  if (
    order.escrowStatus !== "held" &&
    order.status !== "paid_held_in_escrow" &&
    order.status !== "delivered"
  ) {
    return false;
  }
  const status = order.productVerificationStatus;
  return !status || status === "awaiting_seller";
}

function matchesFilter(order: Order, filter: OrderFilter): boolean {
  if (filter === "all") return true;
  if (filter === "held") return isHeld(order);
  if (filter === "pending_payment") {
    return (
      order.status === "pending_payment" || order.paymentStatus === "pending"
    );
  }
  if (filter === "failed") return order.paymentStatus === "failed";
  if (filter === "evidence") return needsEvidence(order);
  if (filter === "disputed") return order.status === "disputed";
  if (filter === "refunded") {
    return order.status === "refunded" || order.escrowStatus === "refunded";
  }
  return true;
}

function orderBadgeVariant(
  order: Order,
): "pending" | "verified" | "rejected" | "muted" | "escrow" {
  if (order.status === "disputed" || order.paymentStatus === "failed") {
    return "rejected";
  }
  if (isHeld(order) || needsEvidence(order)) return "escrow";
  if (order.status === "pending_payment" || order.paymentStatus === "pending") {
    return "pending";
  }
  if (
    order.status === "released" ||
    order.escrowStatus === "released" ||
    order.status === "confirmed"
  ) {
    return "verified";
  }
  return "muted";
}

function parseFilter(raw: string | null): OrderFilter {
  const allowed = new Set(filterOptions.map((o) => o.value));
  if (raw && allowed.has(raw as OrderFilter)) return raw as OrderFilter;
  return "all";
}

export function AdminOrdersPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("filter"));
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    text: string;
    variant: "success" | "error";
  } | null>(null);

  function setFilter(next: OrderFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function load() {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesFilter(order, filter)) return false;
      if (!q) return true;
      const haystack = [
        order.id,
        order.listingTitle,
        order.buyerName,
        order.buyerEmail,
        order.sellerName,
        order.stripePaymentIntentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, filter, query]);

  async function handleRefund(orderId: string) {
    const user = getSessionUser();
    if (!user) return;
    const reason = reasonDrafts[orderId]?.trim() ?? "";
    if (
      !window.confirm(
        reason
          ? `تأكيد استرداد الطلب؟\nالسبب: ${reason}`
          : "تأكيد استرداد المبلغ للمشتري؟",
      )
    ) {
      return;
    }
    setBusyId(orderId);
    setMessage(null);
    try {
      const response = await adminFetch(`/api/orders/${orderId}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const data = await response.json();
      if (response.ok && data.order) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? data.order : order)),
        );
        setMessage({ variant: "success", text: "تم استرداد الطلب." });
        setExpandedId(null);
      } else {
        setMessage({
          variant: "error",
          text: data.error ? String(data.error) : "تعذّر الاسترداد.",
        });
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleRelease(orderId: string) {
    const user = getSessionUser();
    if (!user) return;
    if (!window.confirm("تأكيد تحرير الضمان للبائع؟")) return;
    setBusyId(orderId);
    setMessage(null);
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/release`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? data.order : order)),
        );
        setMessage({ variant: "success", text: "تم تحرير الضمان للبائع." });
      } else {
        setMessage({
          variant: "error",
          text: data.error ? String(data.error) : "تعذّر تحرير الضمان.",
        });
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="admin-ops__toolbar flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            label="بحث"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="عنوان، مشتري، بائع، رقم طلب…"
            value={query}
          />
        </div>
        <div className="min-w-[11rem]">
          <Select
            label="التصفية"
            onChange={(e) => setFilter(e.target.value as OrderFilter)}
            options={filterOptions}
            value={filter}
          />
        </div>
      </div>

      {message ? (
        <FormMessage variant={message.variant}>{message.text}</FormMessage>
      ) : null}

      <p className="admin-ops__queue-meta">
        {filtered.length} من {orders.length} طلب
      </p>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">
            {orders.length === 0
              ? "لا توجد طلبات بعد."
              : "لا نتائج لهذه التصفية."}
          </p>
        </Card>
      ) : (
        <ul className="admin-boxes__grid">
          {filtered.map((order) => {
            const held = isHeld(order);
            const evidenceMissing = needsEvidence(order);
            const proofUrls = order.sellerProofUrls ?? [];
            const expanded = expandedId === order.id;
            return (
              <li key={order.id} className="admin-boxes__card admin-boxes__card--wide">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="admin-ops__queue-label">{order.listingTitle}</p>
                    <p className="admin-ops__queue-meta font-mono">{order.id}</p>
                    <p className="admin-ops__queue-meta">
                      {order.buyerName} → {order.sellerName}
                      {order.customerType
                        ? ` · ${customerTypeLabels[order.customerType]}`
                        : ""}
                    </p>
                    <p className="admin-ops__queue-meta">
                      {new Date(order.createdAt).toLocaleString("ar-AE")}
                      {order.repurchasedFromOrderId
                        ? ` · إعادة شراء من ${order.repurchasedFromOrderId}`
                        : ""}
                    </p>
                    {order.productVerificationStatus ? (
                      <p className="admin-ops__queue-meta">
                        التوثيق:{" "}
                        {productVerificationStatusLabel(
                          order.productVerificationStatus,
                        )}
                      </p>
                    ) : evidenceMissing ? (
                      <p className="admin-ops__queue-meta">توثيق المنتج: ناقص</p>
                    ) : null}
                    {proofUrls.length > 0 ? (
                      <p className="admin-ops__queue-meta">
                        أدلة البائع: {proofUrls.length} ملف
                        {order.sellerProofAt
                          ? ` · ${new Date(order.sellerProofAt).toLocaleString("ar-AE")}`
                          : ""}
                      </p>
                    ) : null}
                    {order.sellerProofNote ? (
                      <p className="admin-ops__queue-meta">
                        ملاحظة البائع: {order.sellerProofNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <CurrencyAmount amount={order.fees.total} size="sm" />
                    <Badge variant={orderBadgeVariant(order)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                    <span className="admin-ops__status-chip">
                      ضمان: {escrowStatusLabel(order.escrowStatus)} · دفع:{" "}
                      {paymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </div>

                <div className="admin-boxes__card-actions">
                  <Button
                    href={`/orders/${order.id}`}
                    size="sm"
                    variant="secondary"
                  >
                    عرض
                  </Button>
                  {held ? (
                    <Button
                      loading={busyId === order.id}
                      onClick={() => handleRelease(order.id)}
                      size="sm"
                      type="button"
                    >
                      تحرير ضمان
                    </Button>
                  ) : null}
                  {order.status !== "refunded" ? (
                    <Button
                      onClick={() =>
                        setExpandedId(expanded ? null : order.id)
                      }
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {expanded ? "إخفاء الاسترداد" : "استرداد"}
                    </Button>
                  ) : null}
                </div>

                {expanded && order.status !== "refunded" ? (
                  <div className="mt-3 grid gap-2">
                    <Textarea
                      label="سبب الاسترداد (اختياري — يظهر في السجل)"
                      onChange={(e) =>
                        setReasonDrafts((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      rows={2}
                      value={reasonDrafts[order.id] ?? ""}
                    />
                    {proofUrls.length > 0 ? (
                      <ul className="grid gap-1">
                        {proofUrls.map((url) => (
                          <li key={url}>
                            <a
                              className="admin-ops__text-link"
                              href={url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <Button
                      loading={busyId === order.id}
                      onClick={() => handleRefund(order.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      تأكيد الاسترداد
                    </Button>
                  </div>
                ) : null}

                {order.auditLog.slice(0, 2).length > 0 ? (
                  <ul className="mt-2 grid gap-1">
                    {order.auditLog.slice(0, 2).map((event) => (
                      <li key={event.id} className="admin-ops__queue-meta">
                        {event.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="admin-ops__quick-links">
        <Link className="admin-ops__chip-link" href="/admin/escrow">
          الضمان
        </Link>
        <Link className="admin-ops__chip-link" href="/admin/disputes">
          النزاعات
        </Link>
        <Link className="admin-ops__text-link" href="/admin">
          غرفة التحكم
        </Link>
      </div>
    </div>
  );
}
