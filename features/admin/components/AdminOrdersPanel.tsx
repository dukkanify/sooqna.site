"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

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
import { AdminOrderInlineDesk } from "@/features/admin/components/AdminOrderInlineDesk";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";

const customerTypeLabels: Record<NonNullable<Order["customerType"]>, string> = {
  registered: "مستخدم مسجّل",
  guest: "ضيف",
  guest_converted: "ضيف — تم تحويله لحساب",
};

type OrderFilter =
  | "all"
  | "held"
  | "released"
  | "pending_payment"
  | "failed"
  | "evidence"
  | "disputed"
  | "refunded";

const filterOptions: { label: string; value: OrderFilter }[] = [
  { label: "الكل", value: "all" },
  { label: "ضمان محجوز", value: "held" },
  { label: "محرَّر", value: "released" },
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
  if (filter === "released") {
    return (
      (order.escrowStatus === "released" || order.status === "released") &&
      order.status !== "refunded"
    );
  }
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
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("filter"));
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notifyBusyId, setNotifyBusyId] = useState<string | null>(null);
  const [invoiceBusyId, setInvoiceBusyId] = useState<string | null>(null);
  const [deskId, setDeskId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    text: string;
    variant: "success" | "error";
  } | null>(null);
  const deskOrder = deskId
    ? orders.find((order) => order.id === deskId) ?? null
    : null;

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

  async function handleNotifyPayment(orderId: string) {
    const user = getSessionUser();
    if (!user) return;
    setNotifyBusyId(orderId);
    setMessage(null);
    try {
      const res = await adminFetch(
        `/api/admin/orders/${orderId}/notify-payment`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? data.order : order)),
        );
        setMessage({
          variant: "success",
          text: "تم إرسال إشعار للمشتري لإكمال الدفع.",
        });
      } else {
        const map: Record<string, string> = {
          NO_BUYER: "لا يوجد مشتري مسجّل لإرسال الإشعار.",
          INVALID_STATUS: "الطلب ليس بانتظار الدفع.",
        };
        setMessage({
          variant: "error",
          text: map[String(data.error)] ?? "تعذّر إرسال الإشعار.",
        });
      }
    } finally {
      setNotifyBusyId(null);
    }
  }

  async function handleSendInvoice(orderId: string) {
    const user = getSessionUser();
    if (!user) return;
    setInvoiceBusyId(orderId);
    setMessage(null);
    try {
      const res = await adminFetch(
        `/api/admin/orders/${orderId}/send-invoice`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (data.order) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? data.order : order)),
        );
      }
      const status = String(data.status ?? "");
      if (res.ok && (status === "sent" || status === "skipped")) {
        setMessage({
          variant: "success",
          text:
            status === "skipped"
              ? "الفاتورة مُرسلة مسبقًا — سجّلنا إعادة المحاولة في سجل الطلب."
              : "تم إرسال الفاتورة إلى بريد المشتري.",
        });
      } else {
        const map: Record<string, string> = {
          NO_BUYER_EMAIL: "لا يوجد بريد مشتري لإرسال الفاتورة.",
          NOT_PAID: "لا يمكن إرسال الفاتورة قبل تأكيد الدفع.",
          ORDER_NOT_FOUND: "الطلب غير موجود.",
          EMAIL_FAILED: "تعذّر تسليم الفاتورة لبريد المشتري. راجع إعدادات البريد ثم أعد المحاولة.",
        };
        setMessage({
          variant: "error",
          text:
            map[String(data.error)] ??
            (status === "failed"
              ? map.EMAIL_FAILED
              : "تعذّر إرسال الفاتورة."),
        });
      }
    } finally {
      setInvoiceBusyId(null);
    }
  }

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          راجع الطلبات، افتح المكتب للتفاصيل، وأرسل الفاتورة أو حرّر الضمان من
          مكان واحد.
        </p>
        <div className="admin-desk-toolbar__actions">
          <Button href="/admin/escrow" size="sm" variant="secondary">
            الضمان
          </Button>
          <Button href="/admin/disputes" size="sm" variant="ghost">
            النزاعات
          </Button>
        </div>
      </div>

      <Card className="admin-desk-filters p-4" variant="flat">
        <div className="admin-desk-filters__grid">
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
          <p className="pb-2 text-xs font-semibold text-muted">
            {filtered.length} من {orders.length} طلب
          </p>
        </div>
      </Card>

      {message ? (
        <FormMessage variant={message.variant}>{message.text}</FormMessage>
      ) : null}

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الإعلان / الطلب</th>
                <th>الأطراف</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={6}>
                    {orders.length === 0
                      ? "لا توجد طلبات بعد."
                      : "لا نتائج لهذه التصفية."}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const held = isHeld(order);
                  const evidenceMissing = needsEvidence(order);
                  const proofUrls = order.sellerProofUrls ?? [];
                  return (
                    <tr key={order.id}>
                      <td className="admin-desk-cell-wrap">
                        <p className="admin-desk-cell-title">
                          {order.listingTitle}
                        </p>
                        <p className="font-mono text-xs text-muted">{order.id}</p>
                        {order.productVerificationStatus ? (
                          <p className="text-xs text-muted">
                            التوثيق:{" "}
                            {productVerificationStatusLabel(
                              order.productVerificationStatus,
                            )}
                          </p>
                        ) : evidenceMissing ? (
                          <p className="text-xs text-muted">توثيق المنتج: ناقص</p>
                        ) : null}
                        {proofUrls.length > 0 ? (
                          <p className="text-xs text-muted">
                            أدلة البائع: {proofUrls.length} ملف
                          </p>
                        ) : null}
                        {order.auditLog.slice(0, 2).map((event) => (
                          <p key={event.id} className="text-xs text-muted">
                            {event.message}
                          </p>
                        ))}
                      </td>
                      <td className="admin-desk-cell-wrap text-xs">
                        {order.buyerName} → {order.sellerName}
                        {order.customerType
                          ? ` · ${customerTypeLabels[order.customerType]}`
                          : ""}
                      </td>
                      <td>
                        <CurrencyAmount amount={order.fees.total} size="sm" />
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Badge variant={orderBadgeVariant(order)}>
                            {orderStatusLabel(order.status)}
                          </Badge>
                          <span className="admin-ops__status-chip">
                            ضمان: {escrowStatusLabel(order.escrowStatus)} · دفع:{" "}
                            {paymentStatusLabel(order.paymentStatus)}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(order.createdAt).toLocaleString(
                          intlLocale(locale),
                        )}
                        {order.repurchasedFromOrderId
                          ? ` · إعادة شراء من ${order.repurchasedFromOrderId}`
                          : ""}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => setDeskId(order.id)}
                            size="sm"
                            type="button"
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
                {orders.length === 0
                  ? "لا توجد طلبات بعد."
                  : "لا نتائج لهذه التصفية."}
              </p>
            </li>
          ) : (
            filtered.map((order) => {
              const held = isHeld(order);
              const evidenceMissing = needsEvidence(order);
              const proofUrls = order.sellerProofUrls ?? [];
              return (
                <li key={order.id} className="admin-desk-mobile-card">
                  <div className="admin-desk-mobile-card__head">
                    <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                      {order.listingTitle}
                    </p>
                    <CurrencyAmount amount={order.fees.total} size="sm" />
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span className="font-mono">{order.id}</span>
                    <span>
                      {order.buyerName} → {order.sellerName}
                      {order.customerType
                        ? ` · ${customerTypeLabels[order.customerType]}`
                        : ""}
                    </span>
                    <span>
                      {new Date(order.createdAt).toLocaleString(
                        intlLocale(locale),
                      )}
                    </span>
                    {order.productVerificationStatus ? (
                      <span>
                        التوثيق:{" "}
                        {productVerificationStatusLabel(
                          order.productVerificationStatus,
                        )}
                      </span>
                    ) : evidenceMissing ? (
                      <span>توثيق المنتج: ناقص</span>
                    ) : null}
                    {proofUrls.length > 0 ? (
                      <span>أدلة البائع: {proofUrls.length} ملف</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={orderBadgeVariant(order)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                    <span className="admin-ops__status-chip">
                      ضمان: {escrowStatusLabel(order.escrowStatus)} · دفع:{" "}
                      {paymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  {order.auditLog.slice(0, 2).map((event) => (
                    <p key={event.id} className="text-xs text-muted">
                      {event.message}
                    </p>
                  ))}
                  <div className="admin-desk-mobile-card__actions">
                    <Button
                      onClick={() => setDeskId(order.id)}
                      size="sm"
                      type="button"
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
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </Card>

      <Modal
        description="تفاصيل الطلب والفاتورة والإجراءات — داخل اللوحة فقط."
        onClose={() => setDeskId(null)}
        open={Boolean(deskOrder)}
        size="lg"
        title="مكتب الطلب"
      >
        {deskOrder ? (
          <AdminOrderInlineDesk
            busy={busyId === deskOrder.id}
            invoiceBusy={invoiceBusyId === deskOrder.id}
            locale={locale}
            notifyBusy={notifyBusyId === deskOrder.id}
            onNotifyPayment={() => handleNotifyPayment(deskOrder.id)}
            onReasonChange={(value) =>
              setReasonDrafts((prev) => ({
                ...prev,
                [deskOrder.id]: value,
              }))
            }
            onRefund={() => handleRefund(deskOrder.id)}
            onRelease={() => handleRelease(deskOrder.id)}
            onSendInvoice={() => handleSendInvoice(deskOrder.id)}
            order={deskOrder}
            reasonDraft={reasonDrafts[deskOrder.id] ?? ""}
            showRefund={deskOrder.status !== "refunded"}
            showRelease={isHeld(deskOrder)}
          />
        ) : null}
      </Modal>

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
