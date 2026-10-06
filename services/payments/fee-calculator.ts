import type { OrderFeeBreakdown } from "@/types/domain/order";
import { getAdminSettings, getAdminSettingsSync } from "@/services/admin/admin-settings-store";
import {
  calculateOrderFees as calculateOrderFeesWithRates,
  type OrderFeeRates,
} from "@/shared/payments/order-fees";

export { calculateOrderFees as calculateOrderFeesWithRates } from "@/shared/payments/order-fees";
export type { OrderFeeRates };

function ratesFromSettings(settings: {
  gatewayFeeFixed: number;
  gatewayFeePercent: number;
  platformFeePercent: number;
}): OrderFeeRates {
  return {
    gatewayFeeFixed: settings.gatewayFeeFixed,
    gatewayFeePercent: settings.gatewayFeePercent,
    platformFeePercent: settings.platformFeePercent,
  };
}

/** Sync snapshot — prefer `calculateOrderFeesFromSettings` at checkout. */
export function calculateOrderFees(
  productPrice: number,
  shippingFee = 0,
): OrderFeeBreakdown {
  return calculateOrderFeesWithRates(
    productPrice,
    shippingFee,
    ratesFromSettings(getAdminSettingsSync()),
  );
}

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
