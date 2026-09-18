"use client";

import Link from "next/link";
import type { Category } from "@/types";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import { DragScrollRow } from "@/shared/components/DragScrollRow";
import {
  buildSearchUrl,
  mergeSearchFilters,
  type SearchFilterState,
} from "./search-url";

export const SEARCH_PRICE_BANDS = [
  { label: "حتى 20 ألف", maxPrice: "20000" },
  { label: "حتى 50 ألف", maxPrice: "50000" },
  { label: "حتى 100 ألف", maxPrice: "100000" },
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
  const hrefFor = (patch: Partial<SearchFilterState>) =>
    buildSearchUrl(mergeSearchFilters(selectedFilters, patch), undefined, basePath);

  const emirateChips: QuickChip[] = [
    {
      label: "كل الإمارات",
      active: !selectedFilters.city,
      href: hrefFor({ city: "", area: "" }),
    },
    ...cities.map((city) => ({
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
        selectedFilters.maxPrice === band.maxPrice && !selectedFilters.minPrice;
      return {
        label: band.label,
        active,
        href: hrefFor({
          maxPrice: active ? "" : band.maxPrice,
          minPrice: "",
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
        ...categories.slice(0, 8).map((category) => ({
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
    <div className="min-w-0 space-y-3 md:hidden">
      <ChipRail ariaLabel="الإمارة" chips={emirateChips} />
      <ChipRail ariaLabel="السعر" chips={priceChips} />
      {categoryChips.length > 0 ? (
        <ChipRail ariaLabel="التصنيف" chips={categoryChips} />
      ) : null}
    </div>
  );
}
