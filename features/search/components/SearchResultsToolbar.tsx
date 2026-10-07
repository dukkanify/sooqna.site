"use client";

import type { Category } from "@/types";
import { SavedSearches } from "./SavedSearches";
import { SearchFilterChips } from "./SearchFilterChips";
import { buildSearchUrl, type SearchFilterState } from "./search-url";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocale } from "@/shared/i18n/useLocale";
import { intlLocale } from "@/shared/i18n/locale";

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
  const locale = useLocale();
  const currentUrl = buildSearchUrl(selectedFilters, undefined, basePath);

  return (
    <LocalizedTree>
      <div className="mb-3 space-y-2 md:mb-4 md:space-y-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 text-sm font-semibold text-ink">
            <span className="text-lg font-bold text-primary">
              {resultCount.toLocaleString(intlLocale(locale))}
            </span>{" "}
            إعلان
          </p>
          <SavedSearches
            currentLabel={buildLabel(selectedFilters, categories)}
            currentUrl={currentUrl}
          />
        </div>
        {/*
          Mobile: no stacked emirate/price/category chip rails — those live in
          the فلترة sheet. Keep only removable active chips in one scroll row.
        */}
        <SearchFilterChips
          basePath={basePath}
          categories={categories}
          selectedFilters={selectedFilters}
        />
      </div>
    </LocalizedTree>
  );
}
