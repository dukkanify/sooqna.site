import { NextResponse } from "next/server";
import { getValidSessionUser } from "@/services/auth/require-session";
import { evaluateBuyAgainForOrder } from "@/services/payments/buy-again.service";
import { getOrderById } from "@/services/payments/order-store";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  const user = await getValidSessionUser();
  let repurchase = null;
  if (user && order.buyerId === user.id) {
    try {
      repurchase = await evaluateBuyAgainForOrder(order, user.id);
    } catch {
      repurchase = null;
    }
  }

  return NextResponse.json({ order, repurchase });
}
