import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import {
  getListingReportById,
  patchListingReport,
} from "@/services/listings/listing-report-store";
import {
  getListingById,
  patchListingRecord,
} from "@/services/listings/listing-store";
import { notifyListingRejected } from "@/services/listings/listing-notifications";
import { updateUserAdmin } from "@/services/auth/user-store";

const schema = z.object({
  status: z.enum(["open", "reviewed", "dismissed", "resolved"]).optional(),
  resolutionNote: z.string().max(1000).optional(),
  rejectListing: z.boolean().optional(),
  rejectReason: z.string().max(500).optional(),
  suspendSeller: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminPermission("listings", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const existing = await getListingReportById(id);
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const {
    resolutionNote,
    rejectListing,
    rejectReason,
    suspendSeller,
  } = parsed.data;

  let listingRejected = existing.listingRejected === true;
  let sellerSuspended = existing.sellerSuspended === true;
  const effects: string[] = [];

  if (rejectListing) {
    const listing = await getListingById(existing.listingId);
    if (!listing) {
      return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
    }
    if (listing.status !== "rejected") {
      const reason =
        rejectReason?.trim() ||
        resolutionNote?.trim() ||
        `بلاغ: ${existing.reason}`;
      const updated = await patchListingRecord(existing.listingId, {
        status: "rejected",
        rejectReason: reason,
      });
      if (!updated) {
        return NextResponse.json({ error: "LISTING_UPDATE_FAILED" }, { status: 500 });
      }
      await notifyListingRejected(updated, reason);
      listingRejected = true;
      effects.push("إخفاء الإعلان");
    } else {
      listingRejected = true;
      effects.push("الإعلان مرفوض مسبقاً");
    }
  }

  if (suspendSeller) {
    if (!existing.sellerId) {
      return NextResponse.json({ error: "SELLER_NOT_FOUND" }, { status: 400 });
    }
    const seller = await updateUserAdmin(existing.sellerId, {
      accountStatus: "suspended",
    });
    if (!seller) {
      return NextResponse.json({ error: "SELLER_UPDATE_FAILED" }, { status: 500 });
    }
    sellerSuspended = true;
    effects.push("إيقاف البائع");
  }

  const tookAction = rejectListing === true || suspendSeller === true;
  const nextStatus =
    parsed.data.status ??
    (tookAction ? "resolved" : resolutionNote?.trim() ? "dismissed" : "reviewed");

  const report = await patchListingReport(id, {
    status: nextStatus,
    resolutionNote: resolutionNote?.trim() || existing.resolutionNote,
    resolvedAt: new Date().toISOString(),
    resolvedByName: admin.fullName,
    listingRejected,
    sellerSuspended,
  });

  if (!report) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "listing_report_resolve",
    targetType: "listing_report",
    targetId: id,
    detail: [
      `بلاغ ${existing.listingTitle}`,
      `حالة ${nextStatus}`,
      ...effects,
      resolutionNote?.trim() ? `ملاحظة: ${resolutionNote.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  return NextResponse.json({ report, effects });
}
