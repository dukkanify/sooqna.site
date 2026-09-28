import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";
import {
  mergePopularityScores,
  popularityId,
  type PopularityKind,
} from "@/services/search/search-popularity";

export type SearchPopularityRow = {
  id: string;
  count: number;
  updatedAt: string;
};

const store = createPayloadCollectionStore<SearchPopularityRow>({
  table: "marketplace_search_popularity",
  fileName: "sooqna-search-popularity.json",
  orderBySql: "(payload->>'count')::int DESC NULLS LAST, updated_at DESC",
});

export async function getLivePopularityScores(): Promise<Record<string, number>> {
  const rows = await store.listAll();
  const live: Record<string, number> = {};
  for (const row of rows) {
    if (!row?.id || typeof row.count !== "number") continue;
    live[row.id] = row.count;
  }
  return live;
}

export async function getMergedPopularityScores(): Promise<Record<string, number>> {
  const live = await getLivePopularityScores();
  return mergePopularityScores(live);
}

export async function recordPopularityHits(
  hits: Array<{ kind: PopularityKind; key: string; weight?: number }>,
): Promise<Record<string, number>> {
  if (hits.length === 0) return getMergedPopularityScores();

  const now = new Date().toISOString();
  const existing = await store.listAll();
  const byId = new Map(existing.map((row) => [row.id, row]));

  for (const hit of hits) {
    const key = hit.key?.trim();
    if (!key) continue;
    const id = popularityId(hit.kind, key);
    const weight = Math.max(1, Math.min(20, Math.floor(hit.weight ?? 1)));
    const previous = byId.get(id);
    const next: SearchPopularityRow = {
      id,
      count: (previous?.count ?? 0) + weight,
      updatedAt: now,
    };
    byId.set(id, next);
    await store.upsert(next);
  }

  return mergePopularityScores(
    Object.fromEntries([...byId.values()].map((row) => [row.id, row.count])),
  );
}
