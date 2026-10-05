/**
 * When a category has zero real marketplace listings, surface that category’s
 * curated live-mkt starters in the public browse/search catalog — without
 * enabling the full SOOQNA_LIVE_CATALOG flood for categories that already
 * have real ads (cars, furniture, …).
 */
import { getLiveMarketplaceCatalogListings } from "@/services/listings/live-marketplace-catalog";
import {
  ensureListingsTable,
  getDeletedListingIds,
  insertListingsIfMissing,
  loadPersistedListings,
  upsertListingRow,
} from "@/services/listings/listing-persistence";
import { bumpListingsCache } from "@/services/listings/listings-cache";
import {
  getOptionalPostgresPool,
  isPostgresQuotaOrUnavailableError,
  markPostgresUnavailable,
} from "@/services/db/postgres";
import {
  LIVE_MARKETPLACE_LISTING_SQL,
  isLiveCatalogEnabled,
  isLiveCatalogListing,
} from "@/shared/listings/live-catalog-listing";
import {
  MARKETPLACE_LISTING_EXCLUSION_SQL,
  isMarketplaceListing,
} from "@/services/listings/listing-stats";
import type { Listing } from "@/types";

const TABLE = "marketplace_listings";

let emptyIdsInflight: Promise<string[]> | null = null;
let emptyEnsureInflight: Promise<{
  categories: string[];
  affected: number;
}> | null = null;

/** Category ids with zero active/reserved real marketplace rows. */
export async function getEmptyMarketplaceCategoryIds(): Promise<string[]> {
  if (isLiveCatalogEnabled()) return [];
  if (emptyIdsInflight) return emptyIdsInflight;

  emptyIdsInflight = (async () => {
    try {
      const catalogCategoryIds = [
        ...new Set(
          getLiveMarketplaceCatalogListings().map((listing) => listing.categoryId),
        ),
      ];
      if (catalogCategoryIds.length === 0) return [];

      const counts = new Map<string, number>();
      for (const id of catalogCategoryIds) counts.set(id, 0);

      try {
        if (await ensureListingsTable()) {
          const pool = await getOptionalPostgresPool();
          if (pool) {
            const result = await pool.query(
              `SELECT category_id, COUNT(*)::int AS c
               FROM ${TABLE}
               WHERE COALESCE(NULLIF(payload->>'status', ''), status) IN ('active', 'reserved')
                 AND ${MARKETPLACE_LISTING_EXCLUSION_SQL}
               GROUP BY category_id`,
            );
            for (const row of result.rows) {
              counts.set(String(row.category_id), Number(row.c) || 0);
            }
            return catalogCategoryIds.filter((id) => (counts.get(id) ?? 0) === 0);
          }
        }
      } catch (error) {
        if (!isPostgresQuotaOrUnavailableError(error)) throw error;
        markPostgresUnavailable(error);
      }

      const stored = await loadPersistedListings();
      for (const listing of stored) {
        if (listing.status !== "active" && listing.status !== "reserved") continue;
        if (!isMarketplaceListing(listing)) continue;
        counts.set(
          listing.categoryId,
          (counts.get(listing.categoryId) ?? 0) + 1,
        );
      }
      return catalogCategoryIds.filter((id) => (counts.get(id) ?? 0) === 0);
    } catch (error) {
      console.error(
        "[empty-category] ids skipped:",
        error instanceof Error ? error.message : error,
      );
      return [];
    } finally {
      emptyIdsInflight = null;
    }
  })();

  return emptyIdsInflight;
}

/**
 * Upsert live-mkt starters only for categories that currently have no real
 * marketplace inventory. Safe with SOOQNA_LIVE_CATALOG=false.
 */
export async function ensureEmptyCategoryStartersPublished(options?: {
  force?: boolean;
}): Promise<{ categories: string[]; affected: number }> {
  if (isLiveCatalogEnabled()) {
    return { categories: [], affected: 0 };
  }
  if (emptyEnsureInflight) return emptyEnsureInflight;

  emptyEnsureInflight = (async () => {
    try {
      const categories = await getEmptyMarketplaceCategoryIds();
      if (categories.length === 0) {
        return { categories: [], affected: 0 };
      }

      const emptySet = new Set(categories);
      const deletedIds = await getDeletedListingIds();
      const starters = getLiveMarketplaceCatalogListings().filter(
        (listing) =>
          emptySet.has(listing.categoryId) &&
          (options?.force === true || !deletedIds.has(listing.id)),
      );
      if (starters.length === 0) {
        return { categories, affected: 0 };
      }

      let affected = 0;
      if (options?.force === true) {
        for (const listing of starters) {
          await upsertListingRow(listing);
          affected += 1;
        }
      } else {
        affected = await insertListingsIfMissing(starters);
      }
      if (affected > 0) {
        await bumpListingsCache();
      }
      return { categories, affected };
    } catch (error) {
      console.error(
        "[empty-category] ensure skipped:",
        error instanceof Error ? error.message : error,
      );
      return { categories: [], affected: 0 };
    } finally {
      emptyEnsureInflight = null;
    }
  })();

  return emptyEnsureInflight;
}

/** Active/reserved live-mkt counts for the given category ids. */
export async function countLiveCatalogStartersByCategory(
  categoryIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (categoryIds.length === 0) return counts;
  for (const id of categoryIds) counts.set(id, 0);

  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        const result = await pool.query(
          `SELECT category_id, COUNT(*)::int AS c
           FROM ${TABLE}
           WHERE category_id = ANY($1::text[])
             AND COALESCE(NULLIF(payload->>'status', ''), status) IN ('active', 'reserved')
             AND ${LIVE_MARKETPLACE_LISTING_SQL}
           GROUP BY category_id`,
          [categoryIds],
        );
        for (const row of result.rows) {
          counts.set(String(row.category_id), Number(row.c) || 0);
        }
        return counts;
      }
    }
  } catch (error) {
    if (!isPostgresQuotaOrUnavailableError(error)) throw error;
    markPostgresUnavailable(error);
  }

  const emptySet = new Set(categoryIds);
  const stored = await loadPersistedListings();
  for (const listing of stored) {
    if (!emptySet.has(listing.categoryId)) continue;
    if (!isLiveCatalogListing(listing)) continue;
    if (listing.status !== "active" && listing.status !== "reserved") continue;
    counts.set(
      listing.categoryId,
      (counts.get(listing.categoryId) ?? 0) + 1,
    );
  }
  return counts;
}

export function isLiveCatalogVisibleForEmptyCategories(
  listing: Pick<Listing, "categoryId" | "id" | "source">,
  emptyCategoryIds: ReadonlySet<string> | readonly string[],
): boolean {
  if (!isLiveCatalogListing(listing)) return true;
  if (isLiveCatalogEnabled()) return true;
  const set =
    emptyCategoryIds instanceof Set
      ? emptyCategoryIds
      : new Set(emptyCategoryIds);
  return set.has(listing.categoryId);
}
