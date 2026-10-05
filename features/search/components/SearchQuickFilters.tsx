"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category } from "@/types";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import { DragScrollRow } from "@/shared/components/DragScrollRow";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { sortByPopularity } from "@/services/search/search-popularity";
import { fetchPopularityScores } from "@/features/search/lib/record-search-popularity";
import {
  buildSearchUrl,
  mergeSearchFilters,
  type SearchFilterState,
} from "./search-url";

export const SEARCH_PRICE_BANDS = [
  { label: "0 – 20 ألف AED", maxPrice: "20000", minPrice: "0" },
  { label: "0 – 50 ألف AED", maxPrice: "50000", minPrice: "0" },
  { label: "0 – 100 ألف AED", maxPrice: "100000", minPrice: "0" },
] as const;

type SearchQuickFiltersProps = {
  basePath?: string;
  categories: Category[];
  selectedFilters: SearchFilterState;
};

type QuickChip = {
  active: boolean;
  href: string;
  label: string;
};

function ChipRail({
  ariaLabel,
  chips,
}: {
  ariaLabel: string;
  chips: QuickChip[];
}) {
  return (
    <DragScrollRow
      ariaLabel={ariaLabel}
      className="-mx-1 flex min-w-0 max-w-full snap-x gap-2 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip) => (
        <Link
          key={`${chip.label}-${chip.href}`}
          className={`inline-flex h-9 shrink-0 snap-start items-center rounded-full border px-3.5 text-xs font-bold transition ${
            chip.active
              ? "border-[#c9a45c] bg-[#c9a45c] text-[#0b1628]"
              : "border-border bg-surface text-ink hover:border-[#c9a45c]/50 hover:bg-secondary-soft"
          }`}
          href={chip.href}
        >
          {chip.label}
        </Link>
      ))}
    </DragScrollRow>
  );
}

export function SearchQuickFilters({
  basePath = "/search",
  categories,
  selectedFilters,
}: SearchQuickFiltersProps) {
  const cities = useMarketplaceLocations();
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    void fetchPopularityScores().then((next) => {
      if (!cancelled) setScores(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rankedCities = sortByPopularity(cities, (city) => city.name, scores, "city");
  const rankedCategories = sortByPopularity(
    categories,
    (category) => category.id,
    scores,
    "category",
  );

  const hrefFor = (patch: Partial<SearchFilterState>) =>
    buildSearchUrl(mergeSearchFilters(selectedFilters, patch), undefined, basePath);

  const emirateChips: QuickChip[] = [
    {
      label: "كل الإمارات",
      active: !selectedFilters.city,
      href: hrefFor({ city: "", area: "" }),
    },
    ...rankedCities.map((city) => ({
      label: city.name,
      active: selectedFilters.city === city.name,
      href: hrefFor({
        city: selectedFilters.city === city.name ? "" : city.name,
        area: "",
      }),
    })),
  ];

  const priceChips: QuickChip[] = [
    {
      label: "أي سعر",
      active: !selectedFilters.maxPrice && !selectedFilters.minPrice,
      href: hrefFor({ maxPrice: "", minPrice: "" }),
    },
    ...SEARCH_PRICE_BANDS.map((band) => {
      const active =
        selectedFilters.maxPrice === band.maxPrice &&
        (!selectedFilters.minPrice || selectedFilters.minPrice === band.minPrice);
      return {
        label: band.label,
        active,
        href: hrefFor({
          maxPrice: active ? "" : band.maxPrice,
          minPrice: active ? "" : band.minPrice,
        }),
      };
    }),
  ];

  const showCategories = !basePath.startsWith("/categories/");
  const categoryChips: QuickChip[] = showCategories
    ? [
        {
          label: "كل التصنيفات",
          active: !selectedFilters.category,
          href: hrefFor({
            category: "",
            specs: {},
            ranges: {},
            subcategory: "",
          }),
        },
        ...rankedCategories.slice(0, 8).map((category) => ({
          label: category.name,
          active: selectedFilters.category === category.id,
          href: hrefFor({
            category:
              selectedFilters.category === category.id ? "" : category.id,
            specs: {},
            ranges: {},
            subcategory: "",
          }),
        })),
      ]
    : [];

  return (
    <LocalizedTree>
    <div className="min-w-0 space-y-3 md:hidden">
      <ChipRail ariaLabel="الإمارة" chips={emirateChips} />
      <ChipRail ariaLabel="السعر" chips={priceChips} />
      {categoryChips.length > 0 ? (
        <ChipRail ariaLabel="التصنيف" chips={categoryChips} />
      ) : null}
    </div>
    </LocalizedTree>
  );
}
