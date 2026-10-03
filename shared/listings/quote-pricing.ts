/** Quote-based service pricing: no AED amount is required. */

export const QUOTE_PRICING_LABEL_AR = "حسب عرض سعر";

const QUOTE_VALUES = new Set([
  "quote",
  "quote_only",
  "on_request",
  "onrequest",
  "poa",
  QUOTE_PRICING_LABEL_AR,
]);

const PRICING_SPEC_KEYS = [
  "pricingBasis",
  "priceBasis",
  "pricingMethod",
  "pricingType",
  "priceType",
] as const;

/** True for «حسب عرض سعر» / `quote` (admin snapshots mix both). */
export function isQuotePricingValue(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return false;
  if (QUOTE_VALUES.has(trimmed) || QUOTE_VALUES.has(trimmed.toLowerCase())) {
    return true;
  }
  return trimmed.includes("حسب عرض");
}

function isPricingSpecKey(key: string): boolean {
  return (PRICING_SPEC_KEYS as readonly string[]).includes(key) || /pric/i.test(key);
}

export function quotePricingFromSpecs(
  specs: Record<string, string | number | boolean | undefined> | undefined,
): boolean {
  if (!specs) return false;
  for (const [key, raw] of Object.entries(specs)) {
    if (!isPricingSpecKey(key)) continue;
    if (raw === undefined || raw === null || typeof raw === "boolean") continue;
    if (isQuotePricingValue(String(raw))) return true;
  }
  return false;
}

export function quotePricingFromFormData(formData: FormData): boolean {
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("spec_")) continue;
    if (!isPricingSpecKey(key.slice("spec_".length))) continue;
    if (isQuotePricingValue(String(value))) return true;
  }
  return false;
}

export function listingUsesQuotePricing(listing: {
  categorySpecs?: Record<string, string | number | boolean | undefined>;
}): boolean {
  return quotePricingFromSpecs(listing.categorySpecs);
}
