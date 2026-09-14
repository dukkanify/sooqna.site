import { NextResponse } from "next/server";
import { isSessionUser, requireSessionUser } from "@/services/auth/require-session";
import { executeBuyAgainAction } from "@/services/payments/buy-again.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  try {
    const { id } = await params;
    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      request.headers.get("x-idempotency-key")?.trim() ||
      undefined;

    const { decision, result } = await executeBuyAgainAction({
      orderId: id,
      buyerId: user.id,
      idempotencyKey,
    });

    if (decision.kind === "none") {
      return NextResponse.json({ error: "FORBIDDEN", decision }, { status: 403 });
    }

    if (
      decision.kind === "unavailable" ||
      decision.kind === "listing_gone" ||
      decision.kind === "seller_inactive"
    ) {
      return NextResponse.json(
        { error: "LISTING_NOT_PURCHASABLE", decision },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      decision,
      mode: result?.mode,
      orderId: result?.orderId,
      checkoutUrl: result?.checkoutUrl,
      sessionId: result?.sessionId,
      redirectUrl: result?.redirectUrl,
      checkoutPath: decision.checkoutPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "ORDER_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN" || message === "UNAUTHORIZED"
          ? 403
          : message === "INVALID_STATUS"
            ? 409
            : message === "STRIPE_NOT_CONFIGURED"
              ? 503
              : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
