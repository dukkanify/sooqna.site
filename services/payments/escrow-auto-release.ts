import { getAdminSettings } from "@/services/admin/admin-settings-store";
import { getAllOrders } from "@/services/payments/order-store";
import { adminReleaseEscrow } from "@/services/payments/order-service";
import { createNotification } from "@/services/payments/notification-store";

export type AutoReleaseResult = {
  scanned: number;
  released: number;
  skipped: number;
  errors: Array<{ orderId: string; error: string }>;
};

function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return 0;
  return (to.getTime() - from) / 86_400_000;
}

/**
 * Release held escrow when seller proof is older than escrowHoldDays
 * and the buyer has not confirmed or disputed.
 */
export async function processEscrowAutoRelease(): Promise<AutoReleaseResult> {
  const settings = await getAdminSettings();
  const holdDays = Math.max(1, settings.escrowHoldDays ?? 7);
  const orders = await getAllOrders();

  const result: AutoReleaseResult = {
    scanned: 0,
    released: 0,
    skipped: 0,
    errors: [],
  };

  for (const order of orders) {
    const held =
      order.escrowStatus === "held" ||
      order.status === "paid_held_in_escrow" ||
      order.status === "delivered";
    if (!held) continue;
    if (order.status === "disputed" || order.status === "refunded") continue;
    if (!order.sellerProofAt) continue;

    result.scanned += 1;
    if (daysBetween(order.sellerProofAt) < holdDays) {
      result.skipped += 1;
      continue;
    }

    try {
      const released = await adminReleaseEscrow(order.id);
      if (!released) {
        result.skipped += 1;
        continue;
      }
      result.released += 1;

      if (order.buyerId) {
        await createNotification({
          userId: order.buyerId,
          orderId: order.id,
          type: "escrow_auto_released",
          title: "تحرير تلقائي للضمان",
          body: `انتهت مدة المراجعة لطلب «${order.listingTitle}» وتم تحويل الضمان للبائع.`,
          href: `/orders/${order.id}`,
          dedupeKey: `escrow_auto_release:${order.id}`,
        });
      }
      await createNotification({
        userId: order.sellerId,
        orderId: order.id,
        type: "escrow_auto_released",
        title: "تم تحرير الضمان تلقائياً",
        body: `تم تحرير ضمان طلب «${order.listingTitle}» بعد انتهاء مدة الانتظار.`,
        href: `/orders/${order.id}`,
        dedupeKey: `escrow_auto_release_seller:${order.id}`,
      });
    } catch (error) {
      result.errors.push({
        orderId: order.id,
        error: error instanceof Error ? error.message : "AUTO_RELEASE_FAILED",
      });
    }
  }

  return result;
}

/** Retry Connect transfers for released orders that skipped payout. */
export async function processSkippedConnectPayouts(): Promise<{
  scanned: number;
  transferred: number;
  skipped: number;
  errors: Array<{ orderId: string; error: string }>;
}> {
  const { transferEscrowToSeller } = await import(
    "@/services/payments/stripe-connect.service"
  );
  const { updateOrder } = await import("@/services/payments/order-store");
  const { addWalletTransaction } = await import(
    "@/services/payments/wallet-ledger"
  );

  const orders = await getAllOrders();
  const result = {
    scanned: 0,
    transferred: 0,
    skipped: 0,
    errors: [] as Array<{ orderId: string; error: string }>,
  };

  for (const order of orders) {
    if (order.escrowStatus !== "released") continue;
    if (order.stripeTransferId) continue;
    if (
      order.connectPayoutSkipReason !== "SELLER_NOT_CONNECTED" &&
      order.connectPayoutSkipReason !== "SELLER_PAYOUTS_DISABLED"
    ) {
      continue;
    }

    result.scanned += 1;
    try {
      const payout = await transferEscrowToSeller({
        orderId: order.id,
        sellerId: order.sellerId,
        amountAed: order.fees.productPrice,
        existingTransferId: order.stripeTransferId,
      });

      if (payout.status !== "transferred") {
        result.skipped += 1;
        await updateOrder(order.id, {
          connectPayoutSkipReason: payout.reason,
        });
        continue;
      }

      await updateOrder(order.id, {
        stripeTransferId: payout.transferId,
        connectPayoutSkipReason: undefined,
      });
      await addWalletTransaction(order.sellerId, {
        orderId: order.id,
        type: "withdrawal",
        amount: -order.fees.productPrice,
        description: `تحويل Stripe Connect (إعادة محاولة) — ${order.listingTitle}`,
        status: "completed",
      });
      result.transferred += 1;
    } catch (error) {
      result.errors.push({
        orderId: order.id,
        error: error instanceof Error ? error.message : "RETRY_FAILED",
      });
    }
  }

  return result;
}

/** Used by tests — expose hold check without side effects. */
export function isOrderEligibleForAutoRelease(
  order: {
    status: string;
    escrowStatus?: string;
    sellerProofAt?: string;
  },
  holdDays: number,
  now = new Date(),
): boolean {
  const held =
    order.escrowStatus === "held" ||
    order.status === "paid_held_in_escrow" ||
    order.status === "delivered";
  if (!held || !order.sellerProofAt) return false;
  if (order.status === "disputed" || order.status === "refunded") return false;
  return daysBetween(order.sellerProofAt, now) >= holdDays;
}
