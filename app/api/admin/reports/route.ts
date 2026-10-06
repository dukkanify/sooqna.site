import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import {
  buildDailySeries,
  buildListingCategorySlices,
  buildOrderStatusSlices,
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
    summary: {
      totalOrders: realOrders.length,
      paidOrders: finance.succeededPaidCount,
      refundedOrders: finance.refundedCount,
      /** GMV — merchandise value (productPrice), not buyer fees.total */
      totalVolume: finance.gmv,
      gmv: finance.gmv,
      activeGmv: finance.activeGmv,
      buyerCollected: finance.buyerCollected,
      totalPlatformFees: finance.platformRevenue,
      totalGatewayFees: finance.gatewayFees,
      netPlatformRevenue: finance.netPlatformRevenue,
      refundedAmount: finance.refundedAmount,
      heldEscrowAmount: finance.heldEscrowAmount,
      heldEscrowCount: finance.heldEscrowCount,
      releasedEscrowAmount: finance.releasedEscrowAmount,
      releasedEscrowCount: finance.releasedEscrowCount,
      currency: finance.currency,
      conversionRate:
        realOrders.length === 0
          ? 0
          : Math.round((finance.grossPaidCount / realOrders.length) * 100),
      totalUsers: users.length,
      totalListings: listingStats.totalListings,
      pendingListings: listingStats.pendingListings,
      openDisputes,
    },
    daily: buildDailySeries(realOrders, 7),
    orderStatuses: buildOrderStatusSlices(realOrders),
    topCategories: buildListingCategorySlices(listings),
    recentEvents: events.slice(0, 30),
    walletAccounts: walletDesk.summary.accounts,
    walletBalances: {
      available: walletDesk.summary.available,
      held: walletDesk.summary.held,
    },
  });
}
