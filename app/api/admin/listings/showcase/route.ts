import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { runShowcaseCatalogAction } from "@/services/listings/showcase-catalog.service";
import { getAdminListingRecords } from "@/services/listings/listing-store";

const ACTIONS = new Set(["publish", "hide", "remove"]);

export async function POST(request: Request) {
  const admin = await requireAdminPermission("listings");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = body.action;
  if (!action || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const result = await runShowcaseCatalogAction(
    action as "publish" | "hide" | "remove",
  );
  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: `listing_showcase_${result.action}`,
    targetType: "listing",
    targetId: "sooqna-showcase",
    detail: `${result.action} ${result.affected} showcase listings (${result.flag})`,
  });

  return NextResponse.json({
    ok: true,
    ...result,
    listings: await getAdminListingRecords(),
  });
}
