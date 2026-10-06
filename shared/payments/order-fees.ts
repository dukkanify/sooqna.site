import type { OrderFeeBreakdown } from "@/types/domain/order";

/** Keep in sync with admin-settings-store DEFAULT_SETTINGS. */
export const DEFAULT_ORDER_FEE_RATES = {
  platformFeePercent: 2.5,
  gatewayFeePercent: 2.9,
  gatewayFeeFixed: 1,
} as const;

export type OrderFeeRates = {
  gatewayFeeFixed: number;
  gatewayFeePercent: number;
  platformFeePercent: number;
};

/** Live admin-panel rates only — never fills 2.5% defaults. */
export function resolveOrderFeeRates(
  source: Partial<OrderFeeRates> | null | undefined,
): OrderFeeRates | null {
  if (
    !source ||
    typeof source.platformFeePercent !== "number" ||
    typeof source.gatewayFeePercent !== "number" ||
    typeof source.gatewayFeeFixed !== "number"
  ) {
    return null;
  }
  return {
    gatewayFeeFixed: source.gatewayFeeFixed,
    gatewayFeePercent: source.gatewayFeePercent,
    platformFeePercent: source.platformFeePercent,
  };
}

/**
 * Marketplace buyer total = listing + shipping + admin platform %.
 * Estimated gateway cost is recorded for finance, but absorbed in the
 * platform take — it is not added on top of the buyer.
 */
export function calculateOrderFees(
  productPrice: number,
  shippingFee = 0,
  rates: OrderFeeRates = DEFAULT_ORDER_FEE_RATES,
): OrderFeeBreakdown {
  const platformRate = rates.platformFeePercent / 100;
  const gatewayRate = rates.gatewayFeePercent / 100;
  const gatewayFixed = rates.gatewayFeeFixed;

  const safePrice = Math.max(0, Math.round(productPrice));
  const safeShipping = Math.max(0, Math.round(shippingFee));
  const platformFee = Math.round(safePrice * platformRate);
  const gatewayFee = Math.round(safePrice * gatewayRate + gatewayFixed);
  const total = safePrice + safeShipping + platformFee;

  return {
    productPrice: safePrice,
    shippingFee: safeShipping,
    gatewayFee,
    platformFee,
    total,
    currency: "AED",
  };
}

/** True only on legacy orders that billed Stripe fees as a buyer surcharge. */
export function isGatewayPassedThrough(fees: {
  gatewayFee: number;
  platformFee: number;
  productPrice: number;
  shippingFee: number;
  total: number;
}): boolean {
  if (fees.gatewayFee <= 0) return false;
  const billed = Math.round(
    fees.productPrice + fees.shippingFee + fees.platformFee + fees.gatewayFee,
  );
  return Math.round(fees.total) === billed;
}

export function stripeAmountFils(totalAed: number): number {
  return Math.round(Math.max(0, totalAed) * 100);
}
