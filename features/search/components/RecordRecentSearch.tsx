"use client";

import { useEffect } from "react";
import { addRecentSearch } from "@/services/storage";
import { recordCompletedSearch } from "@/features/search/lib/record-search-popularity";

type RecordRecentSearchProps = {
  brand?: string;
  category?: string;
  city?: string;
  query?: string;
  specs?: Record<string, string>;
};

/** Records a completed search into recent history + popularity rankings. */
export function RecordRecentSearch({
  brand,
  category,
  city,
  query,
  specs,
}: RecordRecentSearchProps) {
  const specsKey = JSON.stringify(specs ?? {});

  useEffect(() => {
    if (query?.trim()) addRecentSearch(query);
    recordCompletedSearch({
      query,
      category,
      city,
      brand,
      specs: specsKey ? (JSON.parse(specsKey) as Record<string, string>) : undefined,
    });
  }, [brand, category, city, query, specsKey]);

  return null;
}
