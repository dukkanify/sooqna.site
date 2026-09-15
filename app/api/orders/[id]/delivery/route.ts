import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  getOrderById,
  isValidOrderTransition,
  updateOrder,
} from "@/services/payments/order-store";
import type { OrderStatus } from "@/types/domain/order";

type RouteParams = { params: Promise<{ id: string }> };

type DeliveryAction =
  | "seller_preparing"
  | "shipped"
  | "ready_for_pickup"
  | "delivered";

/**
 * Seller-controlled delivery lifecycle updates for physical goods.
 * Pickup orders use ready_for_pickup; shipping orders use shipped.
 */
export async function POST(request: Request, context: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: DeliveryAction;
    trackingRef?: string;
    note?: string;
  };

  const action = body.action;
  if (
    !action ||
    ![
      "seller_preparing",
      "shipped",
      "ready_for_pickup",
      "delivered",
    ].includes(action)
  ) {
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  }

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (order.sellerId !== user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const nextStatus = action as OrderStatus;
  if (!isValidOrderTransition(order.status, nextStatus)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  if (action === "shipped" && order.shippingMethod === "pickup") {
    return NextResponse.json(
      { error: "PICKUP_ORDER_CANNOT_SHIP" },
      { status: 400 },
    );
  }
  if (action === "ready_for_pickup" && order.shippingMethod === "express") {
    // express/standard use shipped; pickup uses ready_for_pickup
  }
  if (
    action === "ready_for_pickup" &&
    order.shippingMethod &&
    order.shippingMethod !== "pickup"
  ) {
    return NextResponse.json(
      { error: "SHIPPING_ORDER_USE_SHIPPED" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const patch: Partial<import("@/types/domain/order").Order> = {
    status: nextStatus,
  };
  if (action === "shipped") {
    patch.shippedAt = now;
    if (body.trackingRef?.trim()) {
      patch.shippingTrackingRef = body.trackingRef.trim().slice(0, 120);
    }
  }
  if (action === "ready_for_pickup") {
    patch.readyForPickupAt = now;
  }
  if (action === "delivered") {
    patch.deliveredAt = now;
  }

  const updated = await updateOrder(id, patch, {
    type: `delivery_${action}`,
    message:
      action === "seller_preparing"
        ? "البائع بدأ تجهيز الطلب"
        : action === "shipped"
          ? "تم شحن الطلب"
          : action === "ready_for_pickup"
            ? "الطلب جاهز للاستلام"
            : "تم تسليم الطلب",
    metadata: body.trackingRef
      ? { trackingRef: body.trackingRef.trim().slice(0, 120) }
      : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order: updated });
}
