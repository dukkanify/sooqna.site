"use client";

import Link from "next/link";
import { useLocale } from "@/shared/i18n/useLocale";
import type { MarketQuickSearch } from "@/services/content/homepage-marketplace.content";
import { recordHeroPillClick } from "@/features/search/lib/record-search-popularity";

type MarketHeroPillsProps = {
  searchesAr: MarketQuickSearch[];
  searchesEn: MarketQuickSearch[];
};

export function MarketHeroPills({ searchesAr, searchesEn }: MarketHeroPillsProps) {
  const locale = useLocale();
  const searches = locale === "en" ? searchesEn : searchesAr;

  return (
    <div className="market-hero-pills" data-no-tx>
      {searches.map((tag) => (
        <Link
          key={tag.key}
          className="market-hero-pill"
          href={tag.href}
          onClick={() => recordHeroPillClick(tag.key)}
        >
          {tag.label}
        </Link>
      ))}
    </div>
  );
}
