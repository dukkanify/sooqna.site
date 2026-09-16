"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Order } from "@/types";
import {
  escrowStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
  productVerificationStatusLabel,
} from "@/services/activity/activity-labels";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";

type EscrowFilter = "held" | "all" | "released" | "refunded";

const filterOptions: { label: string; value: EscrowFilter }[] = [
  { label: "محجوز الآن", value: "held" },
  { label: "الكل", value: "all" },
  { label: "محرَّر", value: "released" },
  { label: "مسترد", value: "refunded" },
];

function isHeld(order: Order): boolean {
  return (
    order.escrowStatus === "held" || order.status === "paid_held_in_escrow"
  );
}

function matchesFilter(order: Order, filter: EscrowFilter): boolean {
  if (filter === "all") return true;
  if (filter === "held") return isHeld(order);
  if (filter === "released") return order.escrowStatus === "released";
  if (filter === "refunded") return order.escrowStatus === "refunded";
  return true;
}

export function AdminEscrowPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({ activeHolds: 0, totalProtected: 0 });
  const [filter, setFilter] = useState<EscrowFilter>("held");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    text: string;
    variant: "success" | "error";
  } | null>(null);

  function load() {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/escrow")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        if (data.summary) setSummary(data.summary);
      })
      .catch(() => undefined);
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
        order.sellerName,
        order.stripePaymentIntentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, filter, query]);

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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ variant: "success", text: "تم تحرير الضمان للبائع." });
        load();
      } else {
        setMessage({
          variant: "error",
          text:
            data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : "تعذّر تحرير الضمان.",
        });
      }
    } finally {
      setBusyId(null);
    }
  }

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
      const res = await adminFetch(`/api/orders/${orderId}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ variant: "success", text: "تم استرداد الطلب." });
        setExpandedId(null);
        load();
      } else {
        setMessage({
          variant: "error",
          text:
            data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : "تعذّر الاسترداد.",
        });
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">حجوزات نشطة</p>
          <p className="admin-ops__kpi-value">{summary.activeHolds}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">إجمالي المحمي</p>
          <div className="admin-ops__kpi-value">
            <CurrencyAmount amount={summary.totalProtected} size="md" />
          </div>
        </div>
      </div>

      <div className="admin-ops__toolbar flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            label="بحث"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="عنوان، مشتري، بائع…"
            value={query}
          />
        </div>
        <div className="min-w-[10rem]">
          <Select
            label="التصفية"
            onChange={(e) => setFilter(e.target.value as EscrowFilter)}
            options={filterOptions}
            value={filter}
          />
        </div>
      </div>

      {message ? (
        <FormMessage variant={message.variant}>{message.text}</FormMessage>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">
            {orders.length === 0
              ? "لا توجد معاملات ضمان."
              : "لا نتائج لهذه التصفية."}
          </p>
        </Card>
      ) : (
        <ul className="admin-boxes__grid">
          {filtered.map((order) => {
            const held = isHeld(order);
            const expanded = expandedId === order.id;
            return (
              <li key={order.id} className="admin-boxes__card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="admin-ops__queue-label">{order.listingTitle}</p>
                    <p className="admin-ops__queue-meta">
                      {order.buyerName} → {order.sellerName}
                    </p>
                    <p className="admin-ops__queue-meta">
                      {new Date(order.createdAt).toLocaleString("ar-AE")}
                    </p>
                    {order.productVerificationStatus ? (
                      <p className="admin-ops__queue-meta">
                        التوثيق:{" "}
                        {productVerificationStatusLabel(
                          order.productVerificationStatus,
                        )}
                      </p>
                    ) : null}
                    {order.stripePaymentIntentId ? (
                      <p className="admin-ops__queue-meta font-mono">
                        {order.stripePaymentIntentId}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <CurrencyAmount amount={order.fees.productPrice} size="sm" />
                    <Badge variant={held ? "escrow" : "muted"}>
                      {escrowStatusLabel(order.escrowStatus)}
                    </Badge>
                    <span className="admin-ops__status-chip">
                      {orderStatusLabel(order.status)} ·{" "}
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
                    <>
                      <Button
                        loading={busyId === order.id}
                        onClick={() => handleRelease(order.id)}
                        size="sm"
                        type="button"
                      >
                        تحرير للبائع
                      </Button>
                      <Button
                        onClick={() =>
                          setExpandedId(expanded ? null : order.id)
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {expanded ? "إخفاء" : "استرداد"}
                      </Button>
                    </>
                  ) : null}
                </div>

                {expanded && held ? (
                  <div className="mt-3 grid gap-2">
                    <Textarea
                      label="سبب الاسترداد (اختياري)"
                      onChange={(e) =>
                        setReasonDrafts((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      rows={2}
                      value={reasonDrafts[order.id] ?? ""}
                    />
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
              </li>
            );
          })}
        </ul>
      )}

      <div className="admin-ops__quick-links">
        <Link
          className="admin-ops__chip-link"
          href="/admin/orders?filter=held"
        >
          الطلبات المحجوزة
        </Link>
        <Link
          className="admin-ops__chip-link"
          href="/admin/orders?filter=evidence"
        >
          توثيق ناقص
        </Link>
        <Link className="admin-ops__chip-link" href="/admin/stripe">
          Stripe
        </Link>
        <Link className="admin-ops__text-link" href="/admin">
          غرفة التحكم
        </Link>
      </div>
    </div>
  );
}
