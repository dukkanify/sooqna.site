import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { NextResponse } from "next/server";
import { buildAdminDashboard } from "@/services/admin/admin-dashboard.service";

/** Thin alias — trends embedded in summary for fewer round-trips. */
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
        rangeDays: dashboard.rangeDays,
        trends: dashboard.trends,
        categoryPerformance: dashboard.categoryPerformance,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/dashboard/trends]", error);
    return NextResponse.json({ error: "TRENDS_LOAD_FAILED" }, { status: 500 });
  }
}
