import type { OrderFeeBreakdown } from "@/types/domain/order";
import { getAdminSettings } from "@/services/admin/admin-settings-store";
import {
  calculateOrderFees as calculateOrderFeesWithRates,
  resolveOrderFeeRates,
  type OrderFeeRates,
} from "@/shared/payments/order-fees";

export { calculateOrderFees as calculateOrderFeesWithRates } from "@/shared/payments/order-fees";
export type { OrderFeeRates };

function ratesFromSettings(settings: {
  gatewayFeeFixed: number;
  gatewayFeePercent: number;
  platformFeePercent: number;
}): OrderFeeRates {
  const rates = resolveOrderFeeRates(settings);
  if (!rates) {
    throw new Error("ADMIN_FEE_RATES_UNAVAILABLE");
  }
  return rates;
}

/**
 * Checkout / order creation — always fresh control-panel rates.
 * Never falls back to factory 2.5% defaults.
 */
export async function calculateOrderFeesFromSettings(
  productPrice: number,
  shippingFee = 0,
): Promise<OrderFeeBreakdown> {
  const settings = await getAdminSettings({ fresh: true });
  return calculateOrderFeesWithRates(
    productPrice,
    shippingFee,
    ratesFromSettings(settings),
  );
}
