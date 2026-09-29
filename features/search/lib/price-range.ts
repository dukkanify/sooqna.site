/** Marketplace listing price helpers — from/to range + AED. */

export const MARKETPLACE_CURRENCY = "AED" as const;

export type PriceRangeDraft = {
  maxPrice?: string;
  minPrice?: string;
};

export type PriceRangeNumbers = {
  max?: number;
  min?: number;
};

/** Parse a filter price string into a non-negative finite number. */
export function parsePriceInput(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

/** True when both bounds are set and min exceeds max. */
export function isPriceRangeInverted(
  minPrice: string | undefined,
  maxPrice: string | undefined,
): boolean {
  const min = parsePriceInput(minPrice);
  const max = parsePriceInput(maxPrice);
  if (min === undefined || max === undefined) return false;
  return min > max;
}

/**
 * Normalize a from–to pair for querying: drop negatives, and when inverted
 * swap bounds so results are never silently empty.
 */
export function normalizePriceRange(
  minPrice: string | undefined,
  maxPrice: string | undefined,
): PriceRangeNumbers {
  let min = parsePriceInput(minPrice);
  let max = parsePriceInput(maxPrice);
  if (min !== undefined && max !== undefined && min > max) {
    const swap = min;
    min = max;
    max = swap;
  }
  return { min, max };
}

export const PRICE_RANGE_ERROR_AR =
  "الحد الأدنى لا يمكن أن يتجاوز الحد الأعلى";
