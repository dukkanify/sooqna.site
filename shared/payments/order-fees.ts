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

/**
 * Single formula for checkout UI, Stripe charge, and stored order.fees.
 * Fees apply to product price only; shipping is added after.
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
  const total = safePrice + safeShipping + platformFee + gatewayFee;

  return {
    productPrice: safePrice,
    shippingFee: safeShipping,
    gatewayFee,
    platformFee,
    total,
    currency: "AED",
  };
}

export function stripeAmountFils(totalAed: number): number {
  return Math.round(Math.max(0, totalAed) * 100);
}
