"use client";

import type { Category } from "@/types";
import { SavedSearches } from "./SavedSearches";
import { SearchFilterChips } from "./SearchFilterChips";
import { SearchQuickFilters } from "./SearchQuickFilters";
import { buildSearchUrl, type SearchFilterState } from "./search-url";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

type SearchResultsToolbarProps = {
  basePath?: string;
  categories: Category[];
  resultCount: number;
  selectedFilters: SearchFilterState;
};

function buildLabel(
  filters: SearchFilterState,
  categories: Category[],
) {
  if (filters.query) return filters.query;
  const categoryName = categories.find((item) => item.id === filters.category)?.name;
  const parts = [categoryName, filters.subcategory, filters.city, filters.area, filters.country].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "بحث مخصص";
}

export function SearchResultsToolbar({
  basePath = "/search",
  categories,
  resultCount,
  selectedFilters,
}: SearchResultsToolbarProps) {
  const currentUrl = buildSearchUrl(selectedFilters, undefined, basePath);

  return (
    <LocalizedTree>
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          <span className="text-lg font-bold text-primary">
            {resultCount.toLocaleString("ar-AE")}
          </span>{" "}
          إعلان
        </p>
      </div>
      <SearchQuickFilters categories={categories} selectedFilters={selectedFilters} />
      <SearchFilterChips
        basePath={basePath}
        categories={categories}
        selectedFilters={selectedFilters}
      />
      <SavedSearches currentLabel={buildLabel(selectedFilters, categories)} currentUrl={currentUrl} />
    </div>
    </LocalizedTree>
  );
}
