import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import {
  QA_ISOLATED_CLEANUP_CONFIRM,
  countQaIsolatedTargets,
  runQaIsolatedCleanup,
} from "@/services/admin/qa-isolated-cleanup";

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) return admin;

  try {
    const counts = await countQaIsolatedTargets();
    return NextResponse.json({
      ok: true,
      expected: { users: 51, listings: 5, notifications: 32 },
      found: counts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "COUNT_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) return admin;

  const body = (await request.json().catch(() => null)) as {
    confirm?: string;
  } | null;
  if (body?.confirm !== QA_ISOLATED_CLEANUP_CONFIRM) {
    return NextResponse.json({ error: "CONFIRMATION_REQUIRED" }, { status: 400 });
  }

  try {
    const result = await runQaIsolatedCleanup();
    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    await logAdminAction({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "qa_isolated_cleanup",
      targetType: "user",
      targetId: "qa-isolated",
      detail: `users ${result.usersDeleted}, listings ${result.listingsDeleted}, notifications ${result.notificationsDeleted}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "CLEANUP_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
