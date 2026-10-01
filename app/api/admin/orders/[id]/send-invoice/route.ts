import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { getOrderById } from "@/services/payments/order-store";
import { sendOrderInvoiceEmail } from "@/services/email/send-order-invoice";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const admin = await requireAdminPermission("orders", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  try {
    const { id } = await params;
    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    if (existing.paymentStatus !== "succeeded" && !existing.paidAt) {
      return NextResponse.json({ error: "NOT_PAID" }, { status: 400 });
    }

    const { order, status } = await sendOrderInvoiceEmail(existing, {
      force: true,
      actorLabel: admin.fullName || "admin",
    });

    await logAdminAction({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "order_send_invoice",
      targetType: "order",
      targetId: id,
      detail: `إرسال فاتورة — ${order.listingTitle} (${status})`,
    });

    return NextResponse.json({ order, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "UNAUTHORIZED"
        ? 403
        : message === "NO_BUYER_EMAIL"
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
