import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { NextResponse } from "next/server";
import { buildAdminDashboard } from "@/services/admin/admin-dashboard.service";

export async function GET(request: Request) {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }
  const range = new URL(request.url).searchParams.get("range");
  try {
    const dashboard = await buildAdminDashboard(admin, range);
    return NextResponse.json(
      {
        actionCenter: dashboard.actionCenter,
        operations: dashboard.operations,
        risk: dashboard.risk,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/dashboard/actions]", error);
    return NextResponse.json({ error: "ACTIONS_LOAD_FAILED" }, { status: 500 });
  }
}
