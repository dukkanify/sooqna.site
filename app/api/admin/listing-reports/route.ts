import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { NextResponse } from "next/server";
import { getAllListingReports } from "@/services/listings/listing-report-store";
import { resolveDisplayMaps } from "@/services/display/resolve-display-labels";
import { humanDisplayLabel } from "@/shared/display/technical-id";
import { listingDetailsHref } from "@/shared/listings/listing-url";

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }
  const reports = await getAllListingReports();
  const { users, listings } = await resolveDisplayMaps({
    userIds: reports.flatMap((item) => [item.sellerId, item.reporterUserId]),
    listingIds: reports.map((item) => item.listingId),
  });

  return NextResponse.json({
    reports: reports.map((item) => {
      const seller = item.sellerId ? users.get(item.sellerId) : undefined;
      const listing = listings.get(item.listingId);
      return {
        ...item,
        listingTitle: listing?.title ?? humanDisplayLabel(item.listingTitle, "إعلان"),
        listingHref:
          listing?.href ??
          listingDetailsHref({ id: item.listingId, slug: item.listingSlug }),
        sellerName: seller?.name ?? humanDisplayLabel(item.sellerName, "—"),
        sellerHref: seller?.href,
      };
    }),
  });
}
