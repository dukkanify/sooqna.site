import type { ListingCondition, ListingSearchFilters } from "@/types";
import type { SearchFilterState } from "@/features/search/components/search-url";

function toNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compactRecord(input: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!input) return undefined;
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value.trim()) next[key] = value.trim();
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function toListingSearchFilters(
  filters: SearchFilterState,
): ListingSearchFilters {
  const specMin: Record<string, number> = {};
  const specMax: Record<string, number> = {};
  for (const [key, range] of Object.entries(filters.ranges ?? {})) {
    const min = toNumber(range.min);
    const max = toNumber(range.max);
    if (typeof min === "number") specMin[key] = min;
    if (typeof max === "number") specMax[key] = max;
  }

  const condition = filters.condition;
  return {
    area: filters.area?.trim() || undefined,
    categoryId: filters.category?.trim() || undefined,
    categorySpecs: compactRecord(filters.specs),
    city: filters.city?.trim() || undefined,
    condition:
      condition === "new" ||
      condition === "used" ||
      condition === "excellent" ||
      condition === "refurbished" ||
      condition === "for_parts" ||
      condition === "not_working"
        ? (condition as ListingCondition)
        : undefined,
    country: filters.country?.trim() || undefined,
    maxPrice: toNumber(filters.maxPrice),
    minPrice: toNumber(filters.minPrice),
    query: filters.query?.trim() || undefined,
    sort:
      filters.sort === "price_asc" || filters.sort === "price_desc"
        ? filters.sort
        : "newest",
    specMax: Object.keys(specMax).length > 0 ? specMax : undefined,
    specMin: Object.keys(specMin).length > 0 ? specMin : undefined,
    subcategory: filters.subcategory?.trim() || undefined,
  };
}
