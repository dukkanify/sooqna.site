import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { filterRealOrders } from "@/services/admin/admin-finance-metrics";
import { getAllOrders } from "@/services/payments/order-store";

export async function GET() {
  const admin = await requireAdminPermission("payments", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const orders = filterRealOrders(await getAllOrders());
  // Include held, released, and refunded so the desk filters match real escrow history.
  const escrowOrders = orders.filter(
    (order) =>
      order.escrowStatus === "held" ||
      order.escrowStatus === "released" ||
      order.escrowStatus === "refunded" ||
      order.status === "paid_held_in_escrow" ||
      order.status === "refunded",
  );

  const summary = {
    activeHolds: escrowOrders.filter((o) => o.escrowStatus === "held").length,
    totalProtected: escrowOrders
      .filter((o) => o.escrowStatus === "held")
      .reduce((sum, o) => sum + o.fees.productPrice, 0),
    currency: "AED" as const,
  };

  return NextResponse.json({ orders: escrowOrders, summary });
}
