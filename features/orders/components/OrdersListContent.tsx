"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/types";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

const statusLabels: Record<Order["status"], string> = {
  pending_payment: "بانتظار الدفع",
  paid_held_in_escrow: "محجوز في الضمان",
  seller_preparing: "البائع يجهّز الطلب",
  shipped: "تم الشحن",
  ready_for_pickup: "جاهز للاستلام",
  delivered: "تم التسليم",
  confirmed: "تم التأكيد",
  released: "تم التحويل",
  disputed: "نزاع",
  refunded: "مسترد",
  cancelled: "ملغى",
};

type OrderRow = Order & { canRate?: boolean };

export function OrdersListContent() {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    const user = getSessionUser();
    if (!user) return;
    fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then(async (data) => {
        const list = (data.orders ?? []) as Order[];
        const enriched = await Promise.all(
          list.map(async (order) => {
            if (order.status !== "released" || order.buyerId !== user.id) {
              return { ...order, canRate: false };
            }
            try {
              const res = await fetch(`/api/orders/${order.id}/rate`, {
                credentials: "include",
              });
              if (!res.ok) return { ...order, canRate: false };
              const info = await res.json();
              return { ...order, canRate: Boolean(info.canRate) };
            } catch {
              return { ...order, canRate: false };
            }
          }),
        );
        setOrders(enriched);
      })
      .catch(() => setOrders([]));
  }, []);

  if (orders.length === 0) {
    return (
      <LocalizedTree>
      <Card className="p-8 text-center" variant="flat">
        <p className="text-sm text-muted">لا توجد طلبات بعد.</p>
      </Card>
      </LocalizedTree>
    );
  }

  return (
    <LocalizedTree>
    <ul className="grid gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link href={`/orders/${order.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-primary/30" variant="flat">
              <div>
                <p className="font-semibold text-ink" data-ugc>{order.listingTitle}</p>
                <p className="mt-0.5 text-xs text-muted">{order.id}</p>
                {order.canRate ? (
                  <p className="mt-1 text-xs font-bold text-secondary">
                    قيّم البائع الآن
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {order.canRate ? (
                  <Badge variant="escrow">تقييم مطلوب</Badge>
                ) : null}
                <Badge variant="muted">{statusLabels[order.status]}</Badge>
                <CurrencyAmount amount={order.fees.total} size="sm" />
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
    </LocalizedTree>
  );
}
