"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/shared/i18n/useLocale";
import type { MarketQuickSearch } from "@/services/content/homepage-marketplace.content";
import { sortByPopularity } from "@/services/search/search-popularity";
import {
  fetchPopularityScores,
  recordHeroPillClick,
} from "@/features/search/lib/record-search-popularity";

type MarketHeroPillsProps = {
  searchesAr: MarketQuickSearch[];
  searchesEn: MarketQuickSearch[];
};

export function MarketHeroPills({ searchesAr, searchesEn }: MarketHeroPillsProps) {
  const locale = useLocale();
  const base = locale === "en" ? searchesEn : searchesAr;
  const [liveScores, setLiveScores] = useState<Record<string, number> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchPopularityScores().then((scores) => {
      if (!cancelled) setLiveScores(scores);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const searches = useMemo(() => {
    // API already returns seed + live merged scores.
    if (!liveScores) return base;
    return sortByPopularity(base, (item) => item.key, liveScores, "pill");
  }, [base, liveScores]);

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
