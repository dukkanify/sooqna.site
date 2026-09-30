import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
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
    walletAccounts: wallets.length,
    walletBalances: {
      available: wallets.reduce((sum, w) => sum + w.availableBalance, 0),
      held: wallets.reduce((sum, w) => sum + w.heldInEscrow, 0),
    },
  });
}
