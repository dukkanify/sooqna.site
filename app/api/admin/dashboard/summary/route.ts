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

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range");

  try {
    const dashboard = await buildAdminDashboard(admin, range);
    return NextResponse.json(dashboard, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[admin/dashboard/summary]", error);
    return NextResponse.json(
      { error: "DASHBOARD_LOAD_FAILED", message: "تعذر تحميل لوحة التحكم." },
      { status: 500 },
    );
  }
}
