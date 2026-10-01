import { NextResponse } from "next/server";
import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { purgeDemoOpsData } from "@/services/admin/purge-demo-ops";

/**
 * Remove demo/seed orders, wallets, and @sooqna.demo users from durable stores.
 * Public KPIs already hide these rows — this deletes them for a clean launch DB.
 */
export async function POST() {
  const admin = await requireAdminPermission("orders", "delete");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const result = await purgeDemoOpsData();
  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "ops_purge_demo",
    targetType: "system",
    targetId: "demo-ops",
    detail: `orders=${result.removedOrders} wallets=${result.removedWallets} users=${result.removedUsers}`,
  });

  return NextResponse.json({ ok: true, ...result });
}
