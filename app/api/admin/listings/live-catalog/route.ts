import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { removeLiveMarketplaceCatalog } from "@/services/listings/live-marketplace-catalog.service";
import { getAdminListingRecords } from "@/services/listings/listing-store";

/**
 * Admin cleanup for curated live-mkt seed inventory.
 * Does not touch real user listings. Re-publish requires SOOQNA_LIVE_CATALOG=true.
 */
export async function POST(request: Request) {
  const admin = await requireAdminPermission("listings", "delete");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "remove") {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const result = await removeLiveMarketplaceCatalog();
  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "listing_live_catalog_remove",
    targetType: "listing",
    targetId: "live-marketplace-catalog",
    detail: `removed ${result.affected} live-mkt seed listings`,
  });

  return NextResponse.json({
    ok: true,
    ...result,
    listings: await getAdminListingRecords(),
  });
}
