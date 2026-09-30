/**
 * Canonical admin finance metrics — single source of truth for GMV, revenue,
 * commissions, refunds, and escrow held/released amounts.
 *
 * Definitions (reconcile against order fee breakdown + payment/escrow status):
 * - GMV: sum of merchandise (`fees.productPrice`) for non-mock paid orders
 *   (payment succeeded or later refunded). Buyer `fees.total` is NOT GMV.
 * - Platform revenue / commissions: sum of `fees.platformFee` on those orders.
 * - Gateway fees: sum of `fees.gatewayFee` (payment processing cost).
 * - Net platform revenue: commissions − gateway fees.
 * - Refunds: merchandise amount on refunded orders (matches treasury).
 * - Held / released escrow: seller merchandise currently held or released.
 * - Mock/demo checkouts ("وضع تجريبي") are excluded from approved reports.
 */
import type { Order } from "@/types/domain/order";

export type FinanceMetrics = {
  /** Orders considered in finance cohort (non-mock, ever paid). */
  grossPaidCount: number;
  /** Currently paymentStatus === succeeded (excludes refunded + mock). */
  succeededPaidCount: number;
  refundedCount: number;
  /** Gross merchandise value — product prices of paid (incl. later refunded). */
  gmv: number;
  /** GMV of currently succeeded (non-refunded) paid orders. */
  activeGmv: number;
  /** Buyer-charged totals (product + shipping + fees) — not GMV. */
  buyerCollected: number;
  /** Platform commissions (`platformFee`). */
  platformRevenue: number;
  gatewayFees: number;
  /** platformRevenue − gatewayFees. */
  netPlatformRevenue: number;
  /** Merchandise amount on refunded orders. */
  refundedAmount: number;
  /** Buyer totals refunded (what left the platform to buyers). */
  refundedBuyerTotal: number;
  heldEscrowCount: number;
  heldEscrowAmount: number;
  releasedEscrowCount: number;
  releasedEscrowAmount: number;
  pendingPaymentCount: number;
  currency: "AED";
};

export type FinanceMetricsOptions = {
  /** Inclusive lower bound (ms since epoch). Filters by paidAt ?? createdAt. */
  sinceMs?: number;
  /** Exclusive upper bound. */
  untilMs?: number;
  /**
   * When true (default), escrow held/released are computed on the full
   * input set (current liability snapshot). When false, escrow follows the
   * same date filter as GMV.
   */
  escrowAsSnapshot?: boolean;
};

const MOCK_PAYMENT_MESSAGE = "وضع تجريبي";

export function isMockPaidOrder(order: Order): boolean {
  const events = order.auditLog ?? [];
  for (const event of events) {
    if (event.type !== "payment_succeeded" && event.type !== "order_paid") {
      continue;
    }
    if (event.message?.includes(MOCK_PAYMENT_MESSAGE)) return true;
    if (event.metadata?.paymentIntentId === "mock") return true;
  }
  return false;
}

/** Admin desks / exports default to real orders only. */
export function filterRealOrders<T extends Order>(orders: T[]): T[] {
  return orders.filter((order) => !isMockPaidOrder(order));
}

export function isRefundedOrder(order: Order): boolean {
  return (
    order.status === "refunded" ||
    order.escrowStatus === "refunded" ||
    order.paymentStatus === "refunded"
  );
}

/** Non-mock order that collected payment at least once. */
export function isGrossPaidOrder(order: Order): boolean {
  if (isMockPaidOrder(order)) return false;
  if (order.paymentStatus === "succeeded") return true;
  if (order.paymentStatus === "refunded") return true;
  return Boolean(order.paidAt);
}

export function isSucceededPaidOrder(order: Order): boolean {
  return order.paymentStatus === "succeeded" && !isMockPaidOrder(order);
}

function orderFinanceTimestampMs(order: Order): number | null {
  const raw = order.paidAt || order.createdAt;
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

export function orderInFinanceRange(
  order: Order,
  options?: Pick<FinanceMetricsOptions, "sinceMs" | "untilMs">,
): boolean {
  if (options?.sinceMs == null && options?.untilMs == null) return true;
  const ts = orderFinanceTimestampMs(order);
  if (ts == null) return false;
  if (options.sinceMs != null && ts < options.sinceMs) return false;
  if (options.untilMs != null && ts >= options.untilMs) return false;
  return true;
}

function merchandise(order: Order): number {
  return Math.max(0, order.fees?.productPrice ?? 0);
}

function buyerTotal(order: Order): number {
  return Math.max(0, order.fees?.total ?? 0);
}

function platformFee(order: Order): number {
  return Math.max(0, order.fees?.platformFee ?? 0);
}

function gatewayFee(order: Order): number {
  return Math.max(0, order.fees?.gatewayFee ?? 0);
}

export function computeFinanceMetrics(
  orders: Order[],
  options: FinanceMetricsOptions = {},
): FinanceMetrics {
  const escrowAsSnapshot = options.escrowAsSnapshot !== false;
  const ranged = orders.filter((order) => orderInFinanceRange(order, options));
  const escrowSource = escrowAsSnapshot ? orders : ranged;

  const grossPaid = ranged.filter(isGrossPaidOrder);
  const succeeded = ranged.filter(isSucceededPaidOrder);
  const refunded = ranged.filter(
    (order) => isRefundedOrder(order) && !isMockPaidOrder(order),
  );

  const gmv = grossPaid.reduce((sum, order) => sum + merchandise(order), 0);
  const activeGmv = succeeded.reduce((sum, order) => sum + merchandise(order), 0);
  const buyerCollected = succeeded.reduce(
    (sum, order) => sum + buyerTotal(order),
    0,
  );
  // Retained commissions: exclude refunded orders (fees no longer earned).
  const platformRevenue = succeeded.reduce(
    (sum, order) => sum + platformFee(order),
    0,
  );
  const gatewayFees = succeeded.reduce(
    (sum, order) => sum + gatewayFee(order),
    0,
  );
  const refundedAmount = refunded.reduce(
    (sum, order) => sum + merchandise(order),
    0,
  );
  const refundedBuyerTotal = refunded.reduce(
    (sum, order) => sum + buyerTotal(order),
    0,
  );

  const heldEscrow = escrowSource.filter(
    (order) => order.escrowStatus === "held" && !isMockPaidOrder(order),
  );
  const releasedEscrow = escrowSource.filter(
    (order) => order.escrowStatus === "released" && !isMockPaidOrder(order),
  );

  const pendingPaymentCount = ranged.filter(
    (order) =>
      !isMockPaidOrder(order) &&
      (order.paymentStatus === "pending" || order.paymentStatus === "processing"),
  ).length;

  return {
    grossPaidCount: grossPaid.length,
    succeededPaidCount: succeeded.length,
    refundedCount: refunded.length,
    gmv,
    activeGmv,
    buyerCollected,
    platformRevenue,
    gatewayFees,
    netPlatformRevenue: platformRevenue - gatewayFees,
    refundedAmount,
    refundedBuyerTotal,
    heldEscrowCount: heldEscrow.length,
    heldEscrowAmount: heldEscrow.reduce(
      (sum, order) => sum + merchandise(order),
      0,
    ),
    releasedEscrowCount: releasedEscrow.length,
    releasedEscrowAmount: releasedEscrow.reduce(
      (sum, order) => sum + merchandise(order),
      0,
    ),
    pendingPaymentCount,
    currency: "AED",
  };
}
