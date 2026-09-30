import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { notifyBuyerPaymentRequired } from "@/services/payments/order-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const admin = await requireAdminPermission("orders", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  try {
    const { id } = await params;
    const order = await notifyBuyerPaymentRequired(id, {
      source: "admin",
      actorId: admin.id,
    });
    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    await logAdminAction({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "order_notify_payment",
      targetType: "order",
      targetId: id,
      detail: `إشعار المشتري بالدفع — ${order.listingTitle}`,
    });

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "UNAUTHORIZED"
        ? 403
        : message === "INVALID_STATUS" || message === "NO_BUYER"
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
