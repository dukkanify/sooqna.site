import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import {
  publishEmptyCategoryStarters,
  removeLiveMarketplaceCatalog,
} from "@/services/listings/live-marketplace-catalog.service";
import { getAdminListingRecords } from "@/services/listings/listing-store";

/**
 * Admin tools for curated live-mkt seed inventory.
 * - remove: hard-delete all live-mkt rows (does not touch real user listings)
 * - publish-empty: upsert starters only into categories with zero real ads
 *   (works with SOOQNA_LIVE_CATALOG=false — no full-catalog flood)
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string };

  if (body.action === "publish-empty") {
    const admin = await requireAdminPermission("listings", "update");
    if (!isSessionUser(admin)) {
      return admin;
    }

    const result = await publishEmptyCategoryStarters();
    await logAdminAction({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "listing_live_catalog_publish_empty",
      targetType: "listing",
      targetId: "live-marketplace-catalog",
      detail: `published empty-category starters for ${result.categories.join(", ") || "none"} (${result.affected} rows)`,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      listings: await getAdminListingRecords(),
    });
  }

  if (body.action !== "remove") {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const admin = await requireAdminPermission("listings", "delete");
  if (!isSessionUser(admin)) {
    return admin;
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
