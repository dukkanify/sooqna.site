import { subcategoryValuesEqual } from "@/shared/listings/listing-filter-match";

type BranchFilters = {
  category?: string;
  query?: string;
  subcategory?: string;
};

type CategoryBranch = {
  id: string;
  subcategories?: readonly string[];
};

/** Canonical subcategory string from a category's taxonomy, or undefined. */
export function matchKnownSubcategory(
  value: string | undefined,
  subcategories: readonly string[],
): string | undefined {
  const needle = value?.trim();
  if (!needle || subcategories.length === 0) return undefined;
  const exact = subcategories.find((item) => item === needle);
  if (exact) return exact;
  return subcategories.find((item) => subcategoryValuesEqual(item, needle));
}

/**
 * Stable branch URL: `/categories/{slug}` or `/categories/{slug}?subcategory=…`.
 * Never uses `q` — branch navigation is an identifier, not a title search.
 */
export function categoryBranchHref(
  slug: string,
  subcategory?: string,
): string {
  const trimmed = subcategory?.trim();
  if (!trimmed) return `/categories/${slug}`;
  return `/categories/${slug}?subcategory=${encodeURIComponent(trimmed)}`;
}

/**
 * When `q` is exactly a known subcategory of this category, treat it as the
 * subcategory identifier and drop the free-text query so old bookmarks match
 * the same listings as chip / directory / filter links.
 */
export function resolveCategoryBranchState<T extends BranchFilters>(
  filters: T,
  subcategories: readonly string[],
): T {
  const fromParam = matchKnownSubcategory(filters.subcategory, subcategories);
  const fromQuery = matchKnownSubcategory(filters.query, subcategories);
  const subcategory = fromParam ?? fromQuery ?? filters.subcategory ?? "";
  const query =
    fromQuery &&
    (!fromParam || subcategoryValuesEqual(fromParam, fromQuery))
      ? ""
      : filters.query;

  if (subcategory === (filters.subcategory ?? "") && query === filters.query) {
    return filters;
  }
  return { ...filters, subcategory, query };
}

export function resolveCategoryBranchStateForCategories<T extends BranchFilters>(
  filters: T,
  categories: readonly CategoryBranch[],
): T {
  const categoryId = filters.category?.trim();
  if (!categoryId) return filters;
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return filters;
  return resolveCategoryBranchState(filters, category.subcategories ?? []);
}
