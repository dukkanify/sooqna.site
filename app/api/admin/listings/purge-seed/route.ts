import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { purgeMockSeedListings } from "@/services/listings/listing-store";

/**
 * Optional admin cleanup of CONFIRMED fixture rows (seed ids + known QA slugs).
 * Public catalog already hides those rows. Never deletes MANUAL_REVIEW records.
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
