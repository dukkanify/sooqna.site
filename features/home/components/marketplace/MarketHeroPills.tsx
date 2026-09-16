"use client";

import Link from "next/link";
import { useLocale } from "@/shared/i18n/useLocale";
import type { MarketQuickSearch } from "@/services/content/homepage-marketplace.content";

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
        <Link key={tag.href} className="market-hero-pill" href={tag.href}>
          {tag.label}
        </Link>
      ))}
    </div>
  );
}
