/** Shared helpers for building /search URLs from filter state. */

export type SearchFilterState = {
  area?: string;
  category?: string;
  city?: string;
  condition?: string;
  country?: string;
  maxPrice?: string;
  minPrice?: string;
  query?: string;
  ranges?: Record<string, { max?: string; min?: string }>;
  sort?: string;
  specs?: Record<string, string>;
  subcategory?: string;
};

const RESERVED = new Set([
  "q",
  "category",
  "city",
  "country",
  "condition",
  "minPrice",
  "maxPrice",
  "sort",
  "price",
  "area",
  "subcategory",
]);

function compact(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function buildSearchUrl(
  filters: SearchFilterState,
  omitKey?: keyof SearchFilterState,
  basePath = "/search",
): string {
  const params = new URLSearchParams();

  if (filters.query && omitKey !== "query") params.set("q", filters.query);
  if (filters.country && omitKey !== "country") params.set("country", filters.country);
  if (filters.city && omitKey !== "city") params.set("city", filters.city);
  if (filters.area && omitKey !== "area") params.set("area", filters.area);
  if (filters.category && omitKey !== "category") {
    params.set("category", filters.category);
  }
  if (filters.subcategory && omitKey !== "subcategory") {
    params.set("subcategory", filters.subcategory);
  }
  if (filters.condition && omitKey !== "condition") {
    params.set("condition", filters.condition);
  }
  if (filters.minPrice && omitKey !== "minPrice") {
    params.set("minPrice", filters.minPrice);
  }
  if (filters.maxPrice && omitKey !== "maxPrice") {
    params.set("maxPrice", filters.maxPrice);
  }
  if (filters.sort && filters.sort !== "newest" && omitKey !== "sort") {
    params.set("sort", filters.sort);
  }

  if (omitKey !== "specs") {
    for (const [key, value] of Object.entries(filters.specs ?? {})) {
      if (compact(value)) params.set(`spec_${key}`, value.trim());
    }
  }
  if (omitKey !== "ranges") {
    for (const [key, range] of Object.entries(filters.ranges ?? {})) {
      if (compact(range.min)) params.set(`min_${key}`, range.min!.trim());
      if (compact(range.max)) params.set(`max_${key}`, range.max!.trim());
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function mergeSearchFilters(
  base: SearchFilterState,
  patch: Partial<SearchFilterState>,
): SearchFilterState {
  return {
    ...base,
    ...patch,
    specs: patch.specs === undefined ? base.specs : patch.specs,
    ranges: patch.ranges === undefined ? base.ranges : patch.ranges,
  };
}

export function omitSearchFilter(
  filters: SearchFilterState,
  target:
    | { kind: "core"; key: keyof SearchFilterState }
    | { kind: "spec"; key: string }
    | { kind: "range"; key: string; bound: "min" | "max" },
): SearchFilterState {
  if (target.kind === "core") {
    return { ...filters, [target.key]: "" };
  }
  if (target.kind === "spec") {
    const specs = { ...filters.specs };
    delete specs[target.key];
    return { ...filters, specs };
  }
  const current = filters.ranges?.[target.key] ?? {};
  const nextRange = { ...current, [target.bound]: "" };
  return {
    ...filters,
    ranges: { ...filters.ranges, [target.key]: nextRange },
  };
}

export function parseSearchFilterState(
  params: Record<string, string | string[] | undefined>,
): SearchFilterState {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const specs: Record<string, string> = {};
  const ranges: Record<string, { max?: string; min?: string }> = {};

  for (const rawKey of Object.keys(params)) {
    const value = compact(get(rawKey));
    if (!value || RESERVED.has(rawKey)) continue;
    if (rawKey.startsWith("spec_")) {
      const key = rawKey.slice(5);
      if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) specs[key] = value;
      continue;
    }
    if (rawKey.startsWith("min_") && rawKey !== "minPrice") {
      const key = rawKey.slice(4);
      if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        ranges[key] = { ...ranges[key], min: value };
      }
      continue;
    }
    if (rawKey.startsWith("max_") && rawKey !== "maxPrice") {
      const key = rawKey.slice(4);
      if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        ranges[key] = { ...ranges[key], max: value };
      }
    }
  }

  return {
    area: get("area") ?? "",
    category: get("category") ?? "",
    city: get("city") ?? "",
    condition: get("condition") ?? "",
    country: get("country") ?? "",
    maxPrice: get("maxPrice") ?? "",
    minPrice: get("minPrice") ?? "",
    query: get("q") ?? "",
    ranges,
    sort: get("sort") ?? "newest",
    specs,
    subcategory: get("subcategory") ?? "",
  };
}

export function activeFilterCount(filters: SearchFilterState): number {
  const core = [
    filters.query,
    filters.city,
    filters.area,
    filters.category,
    filters.subcategory,
    filters.condition,
    filters.minPrice,
    filters.maxPrice,
    filters.sort && filters.sort !== "newest" ? filters.sort : "",
  ].filter(Boolean).length;
  const specs = Object.values(filters.specs ?? {}).filter((value) => compact(value)).length;
  const ranges = Object.values(filters.ranges ?? {}).reduce((sum, range) => {
    return sum + (compact(range.min) ? 1 : 0) + (compact(range.max) ? 1 : 0);
  }, 0);
  return core + specs + ranges;
}
