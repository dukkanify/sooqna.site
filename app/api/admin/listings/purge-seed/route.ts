import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { purgeMockSeedListings } from "@/services/listings/listing-store";

/**
 * Removes confirmed fixture catalog rows (mock seed ids, QA26/E2E preview
 * listings, and known demo slugs). Never deletes unrelated user-created ids.
 */
export async function POST() {
  const admin = await requireAdminPermission("listings");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const result = await purgeMockSeedListings();
  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "listing_purge_seed",
    targetType: "listing",
    targetId: "seed-catalog",
    detail: `removed ${result.removed} seed listings`,
  });

  return NextResponse.json({
    ok: true,
    removed: result.removed,
    remainingSeed: result.remainingSeed,
  });
}
