import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { filterRealOrders } from "@/services/admin/admin-finance-metrics";
import { getAllOrders } from "@/services/payments/order-store";

export async function GET() {
  const admin = await requireAdminPermission("orders", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }
  const orders = filterRealOrders(await getAllOrders());
  return NextResponse.json({ orders });
}
