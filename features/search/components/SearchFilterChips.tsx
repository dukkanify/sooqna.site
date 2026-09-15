"use client";

import Link from "next/link";
import type { Category } from "@/types";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { getCategoryFieldLabel } from "@/shared/constants/category-fields";
import {
  buildSearchUrl,
  omitSearchFilter,
  type SearchFilterState,
} from "./search-url";
import { SEARCH_PRICE_BANDS } from "./SearchQuickFilters";

type SearchFilterChipsProps = {
  basePath?: string;
  categories: Category[];
  selectedFilters: SearchFilterState;
};

const conditionLabels: Record<string, string> = {
  excellent: "ممتاز",
  new: "جديد",
  used: "مستعمل",
};

const rangeLabels: Record<string, { max: string; min: string }> = {
  year: { min: "من السنة", max: "إلى السنة" },
  mileage: { min: "أقل عداد", max: "أعلى عداد" },
  bedrooms: { min: "من غرف النوم", max: "إلى غرف النوم" },
  bathrooms: { min: "من الحمامات", max: "إلى الحمامات" },
  area: { min: "من المساحة", max: "إلى المساحة" },
};

export function SearchFilterChips({
  basePath = "/search",
  selectedFilters,
}: SearchFilterChipsProps) {
  const categoryId = selectedFilters.category ?? "";
  const chips: { href: string; key: string; label: React.ReactNode }[] = [];

  const hrefFor = (next: SearchFilterState) => buildSearchUrl(next, undefined, basePath);
  const priceBandMax = new Set<string>(SEARCH_PRICE_BANDS.map((band) => band.maxPrice));
  const skipBandPriceChip =
    Boolean(selectedFilters.maxPrice) &&
    priceBandMax.has(selectedFilters.maxPrice ?? "") &&
    !selectedFilters.minPrice;

  if (selectedFilters.query) {
    chips.push({
      key: "query",
      label: `"${selectedFilters.query}"`,
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "core", key: "query" })),
    });
  }
  if (selectedFilters.country) {
    chips.push({
      key: "country",
      label: selectedFilters.country,
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "core", key: "country" })),
    });
  }
  if (selectedFilters.area) {
    chips.push({
      key: "area",
      label: selectedFilters.area,
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "core", key: "area" })),
    });
  }
  if (selectedFilters.subcategory) {
    chips.push({
      key: "subcategory",
      label: selectedFilters.subcategory,
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "core", key: "subcategory" })),
    });
  }
  if (selectedFilters.condition) {
    chips.push({
      key: "condition",
      label: conditionLabels[selectedFilters.condition] ?? selectedFilters.condition,
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "core", key: "condition" })),
    });
  }
  if (selectedFilters.minPrice) {
    chips.push({
      key: "minPrice",
      label: (
        <span className="inline-flex items-center gap-1">
          من <CurrencyAmount amount={Number(selectedFilters.minPrice)} size="sm" />
        </span>
      ),
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "core", key: "minPrice" })),
    });
  }
  if (selectedFilters.maxPrice && !skipBandPriceChip) {
    chips.push({
      key: "maxPrice",
      label: (
        <span className="inline-flex items-center gap-1">
          حتى <CurrencyAmount amount={Number(selectedFilters.maxPrice)} size="sm" />
        </span>
      ),
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "core", key: "maxPrice" })),
    });
  }

  for (const [key, value] of Object.entries(selectedFilters.specs ?? {})) {
    if (!value) continue;
    chips.push({
      key: `spec_${key}`,
      label: `${getCategoryFieldLabel(categoryId, key)}: ${value}`,
      href: hrefFor(omitSearchFilter(selectedFilters, { kind: "spec", key })),
    });
  }

  for (const [key, range] of Object.entries(selectedFilters.ranges ?? {})) {
    const labels = rangeLabels[key] ?? {
      min: `من ${getCategoryFieldLabel(categoryId, key)}`,
      max: `إلى ${getCategoryFieldLabel(categoryId, key)}`,
    };
    if (range.min) {
      chips.push({
        key: `min_${key}`,
        label: `${labels.min} ${range.min}`,
        href: hrefFor(omitSearchFilter(selectedFilters, { kind: "range", key, bound: "min" })),
      });
    }
    if (range.max) {
      chips.push({
        key: `max_${key}`,
        label: `${labels.max} ${range.max}`,
        href: hrefFor(omitSearchFilter(selectedFilters, { kind: "range", key, bound: "max" })),
      });
    }
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <LocalizedTree>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-muted">
        {chips.length.toLocaleString("ar-AE")} فلتر نشط
      </span>
      {chips.map((chip) => (
        <Link
          key={chip.key}
          className="premium-chip interactive-lift gap-1.5 !py-1.5 !text-xs text-ink"
          href={chip.href}
        >
          {chip.label}
          <Icon aria-hidden name="close" size={12} />
          <span className="sr-only">إزالة الفلتر</span>
        </Link>
      ))}
      <Link
        className="text-xs font-semibold text-primary transition hover:text-primary-dark"
        href={basePath}
      >
        مسح الكل
      </Link>
    </div>
    </LocalizedTree>
  );
}
