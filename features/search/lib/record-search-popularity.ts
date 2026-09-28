"use client";

import type { PopularityKind } from "@/services/search/search-popularity";
import { resolveHeroPillKey } from "@/services/search/search-popularity";

type PopularityHit = {
  kind: PopularityKind;
  key: string;
  weight?: number;
};

let scoresCache: Record<string, number> | null = null;
let scoresPromise: Promise<Record<string, number>> | null = null;

export async function fetchPopularityScores(
  force = false,
): Promise<Record<string, number>> {
  if (!force && scoresCache) return scoresCache;
  if (!force && scoresPromise) return scoresPromise;

  scoresPromise = fetch("/api/search/popularity", { credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) return scoresCache ?? {};
      const data = (await response.json()) as { scores?: Record<string, number> };
      scoresCache = data.scores ?? {};
      return scoresCache;
    })
    .catch(() => scoresCache ?? {})
    .finally(() => {
      scoresPromise = null;
    });

  return scoresPromise;
}

export function recordSearchPopularity(hits: PopularityHit[]): void {
  if (typeof window === "undefined" || hits.length === 0) return;

  const cleaned = hits
    .map((hit) => ({
      kind: hit.kind,
      key: hit.key.trim(),
      weight: hit.weight ?? 1,
    }))
    .filter((hit) => hit.key.length > 0)
    .slice(0, 20);

  if (cleaned.length === 0) return;

  void fetch("/api/search/popularity", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hits: cleaned }),
    keepalive: true,
  })
    .then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as { scores?: Record<string, number> };
      if (data.scores) scoresCache = data.scores;
    })
    .catch(() => {
      /* best-effort */
    });
}

export function recordHeroPillClick(pillKey: string): void {
  recordSearchPopularity([{ kind: "pill", key: pillKey, weight: 2 }]);
}

export function recordCompletedSearch(input: {
  query?: string;
  category?: string;
  city?: string;
  brand?: string;
  specs?: Record<string, string>;
}): void {
  const hits: PopularityHit[] = [];

  const query = input.query?.trim();
  if (query) {
    hits.push({ kind: "query", key: query });
    const pillKey = resolveHeroPillKey(query);
    if (pillKey) hits.push({ kind: "pill", key: pillKey, weight: 2 });
  }
  if (input.category?.trim()) {
    hits.push({ kind: "category", key: input.category.trim() });
  }
  if (input.city?.trim()) {
    hits.push({ kind: "city", key: input.city.trim() });
  }
  if (input.brand?.trim()) {
    hits.push({ kind: "brand", key: input.brand.trim() });
  }
  for (const [key, value] of Object.entries(input.specs ?? {})) {
    if (!value?.trim() || key === "brand") continue;
    hits.push({ kind: "spec", key: `${key}:${value.trim()}` });
  }

  recordSearchPopularity(hits);
}
