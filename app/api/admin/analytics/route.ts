import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import {
  buildDailySeries,
  buildListingCategorySlices,
  buildOrderStatusSlices,
  buildPaymentStatusSlices,
} from "@/services/admin/admin-analytics";
import {
  computeFinanceMetrics,
  filterRealOrders,
} from "@/services/admin/admin-finance-metrics";
import { getOpenDisputeCount } from "@/services/admin/dispute-store";
import { getAllUsers } from "@/services/auth/user-store";
import {
  getAdminListingRecords,
  getListingsModerationSummary,
} from "@/services/listings/listing-store";
import { getAllOrders } from "@/services/payments/order-store";
import { getPaymentEvents } from "@/services/payments/payment-log";
import { loadAdminWalletsPayload } from "@/services/admin/admin-wallet-metrics";

export async function GET() {
  const admin = await requireAdminPermission("reports", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const [users, listingStats, listings, openDisputes, orders, events, walletDesk] =
    await Promise.all([
      getAllUsers(),
      getListingsModerationSummary(),
      getAdminListingRecords(),
      getOpenDisputeCount(),
      getAllOrders(),
      getPaymentEvents(),
      loadAdminWalletsPayload(),
    ]);

  const realOrders = filterRealOrders(orders);
  const finance = computeFinanceMetrics(realOrders);

  return NextResponse.json({
    overview: {
      totalOrders: realOrders.length,
      paidOrders: finance.succeededPaidCount,
      volume: finance.gmv,
      fees: finance.platformRevenue,
      currency: "AED",
      conversionRate:
        realOrders.length === 0
          ? 0
          : Math.round((finance.grossPaidCount / realOrders.length) * 100),
      totalUsers: users.length,
      totalListings: listingStats.totalListings,
      walletAccounts: walletDesk.summary.accounts,
      recentEvents: events.length,
      openDisputes,
      pendingListings: listingStats.pendingListings,
    },
    daily: buildDailySeries(realOrders, 14),
    orderStatuses: buildOrderStatusSlices(realOrders),
    paymentStatuses: buildPaymentStatusSlices(realOrders),
    topCategories: buildListingCategorySlices(listings),
  });
}
