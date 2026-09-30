import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
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
import { getAllWalletAccounts } from "@/services/payments/wallet-ledger";

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }

  const [users, listingStats, listings, openDisputes, orders, events, wallets] =
    await Promise.all([
      getAllUsers(),
      getListingsModerationSummary(),
      getAdminListingRecords(),
      getOpenDisputeCount(),
      getAllOrders(),
      getPaymentEvents(),
      getAllWalletAccounts(),
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
      walletAccounts: wallets.length,
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
