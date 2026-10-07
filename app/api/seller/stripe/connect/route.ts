import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  createConnectAccountLink,
  createConnectExpressLoginLink,
  getConnectStatusForUser,
  probePlatformConnectEnabled,
  syncConnectAccountFromStripe,
} from "@/services/payments/stripe-connect.service";
import {
  STRIPE_CONNECT_NOT_ENABLED,
  sellerConnectPublicMessage,
} from "@/services/payments/stripe-connect-errors";

function toClientConnect(
  connect: Awaited<ReturnType<typeof getConnectStatusForUser>>,
) {
  return {
    status: connect.status,
    statusLabelAr: connect.statusLabelAr,
    stripeAccountId: connect.stripeAccountId,
    chargesEnabled: connect.chargesEnabled,
    payoutsEnabled: connect.payoutsEnabled,
    detailsSubmitted: connect.detailsSubmitted,
    platformConfigured: connect.platformConfigured,
    platformConnectEnabled: connect.platformConnectEnabled,
    canOpenDashboard: connect.canOpenDashboard,
  };
}

export async function GET() {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) {
    return user;
  }

  try {
    const connect = await getConnectStatusForUser(user, { sync: true });
    return NextResponse.json({ connect: toClientConnect(connect) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CONNECT_STATUS_FAILED";
    if (message === "STRIPE_NOT_CONFIGURED") {
      const connect = await getConnectStatusForUser(user, { sync: false });
      return NextResponse.json({ connect: toClientConnect(connect) });
    }
    return NextResponse.json(
      { error: "CONNECT_STATUS_FAILED", message: sellerConnectPublicMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) {
    return user;
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
  };
  const action = body.action ?? "onboard";

  try {
    if (action === "refresh-status") {
      await probePlatformConnectEnabled({ force: true });
      const record = await syncConnectAccountFromStripe(user.id);
      const connect = await getConnectStatusForUser(user, { sync: false });
      return NextResponse.json({
        ok: true,
        connect: toClientConnect(connect),
        synced: Boolean(record),
      });
    }

    if (action === "dashboard") {
      const url = await createConnectExpressLoginLink(user);
      return NextResponse.json({ ok: true, url });
    }

    const link = await createConnectAccountLink(user, {
      returnPath: "/wallet/stripe/return",
      refreshPath: "/wallet/stripe/refresh",
    });
    return NextResponse.json({
      ok: true,
      url: link.url,
      stripeAccountId: link.stripeAccountId,
      connect: toClientConnect(
        await getConnectStatusForUser(user, { sync: false }),
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CONNECT_ACTION_FAILED";
    const status =
      message === "STRIPE_NOT_CONFIGURED"
        ? 503
        : message === "STRIPE_NOT_CONNECTED" ||
            message === "STRIPE_ONBOARDING_INCOMPLETE"
          ? 409
          : message === STRIPE_CONNECT_NOT_ENABLED
            ? 409
            : 500;
    let connect: ReturnType<typeof toClientConnect> | undefined;
    try {
      connect = toClientConnect(
        await getConnectStatusForUser(user, { sync: false }),
      );
    } catch {
      connect = undefined;
    }
    return NextResponse.json(
      {
        error:
          message === STRIPE_CONNECT_NOT_ENABLED
            ? STRIPE_CONNECT_NOT_ENABLED
            : "CONNECT_ACTION_FAILED",
        message: sellerConnectPublicMessage(error),
        ...(connect ? { connect } : {}),
      },
      { status },
    );
  }
}
