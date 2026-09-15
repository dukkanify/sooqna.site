import { NextResponse } from "next/server";
import {
  processEscrowAutoRelease,
  processSkippedConnectPayouts,
} from "@/services/payments/escrow-auto-release";

function assertCronAuth(request: Request): NextResponse | null {
  const configured = process.env.CRON_SECRET?.trim();
  if (configured) {
    const header =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      request.headers.get("x-cron-secret") ??
      "";
    if (header !== configured) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return null;
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET_REQUIRED" },
      { status: 503 },
    );
  }
  return null;
}

/**
 * Daily escrow maintenance:
 * 1) Auto-release held orders past escrowHoldDays after seller proof
 * 2) Retry Connect transfers when sellers finish onboarding later
 */
export async function POST(request: Request) {
  const authError = assertCronAuth(request);
  if (authError) return authError;

  try {
    const autoRelease = await processEscrowAutoRelease();
    const connectRetry = await processSkippedConnectPayouts();
    return NextResponse.json({
      ok: true,
      autoRelease,
      connectRetry,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ESCROW_MAINTENANCE_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
