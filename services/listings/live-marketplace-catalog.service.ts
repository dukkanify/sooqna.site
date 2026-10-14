import {
  getLiveMarketplaceCatalogListings,
  LIVE_MARKETPLACE_LISTING_SQL,
} from "@/services/listings/live-marketplace-catalog";
import {
  deleteLiveMarketplaceListings,
  ensureListingsTable,
  getDeletedListingIds,
  getMarketplaceFlag,
  insertListingsIfMissing,
  setMarketplaceFlag,
  upsertListingRow,
} from "@/services/listings/listing-persistence";
import { bumpListingsCache } from "@/services/listings/listings-cache";
import {
  getOptionalPostgresPool,
  isPostgresQuotaOrUnavailableError,
  markPostgresUnavailable,
} from "@/services/db/postgres";
import { isLiveCatalogEnabled } from "@/shared/listings/live-catalog-listing";

const LIVE_CATALOG_VERSION_KEY = "live_marketplace_catalog_version";
const LIVE_CATALOG_VERSION = "v9-relative-posted-at";
const LIVE_CATALOG_RETIRED_FLAG = "live_marketplace_catalog_retired";
/** Location pins for titles that name an emirate — runs even when catalog is off. */
const LIVE_LOCATION_REPAIR_KEY = "live_marketplace_location_repair";
const LIVE_LOCATION_REPAIR_VERSION = "v1-title-emirate-pins";

let ensureInflight: Promise<number> | null = null;

async function existingLiveCatalogIds(): Promise<Set<string>> {
  if (!(await ensureListingsTable())) return new Set();
  const pool = await getOptionalPostgresPool();
  if (!pool) return new Set();
  try {
    const result = await pool.query(
      `SELECT id FROM marketplace_listings WHERE ${LIVE_MARKETPLACE_LISTING_SQL}`,
    );
    return new Set(result.rows.map((row) => String(row.id)));
  } catch (error) {
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
      return new Set();
    }
    throw error;
  }
}

/**
 * Refresh city/emirate/area on existing live-mkt rows from seed so filters match
 * titles (e.g. "— دبي") even when SOOQNA_LIVE_CATALOG is off.
 * Never inserts new seed rows while the catalog is disabled.
 */
async function repairLiveCatalogLocations(): Promise<number> {
  const current = await getMarketplaceFlag(LIVE_LOCATION_REPAIR_KEY);
  if (current === LIVE_LOCATION_REPAIR_VERSION) return 0;
  const existingIds = await existingLiveCatalogIds();
  if (existingIds.size === 0) {
    await setMarketplaceFlag(LIVE_LOCATION_REPAIR_KEY, LIVE_LOCATION_REPAIR_VERSION);
    return 0;
  }
  const listings = getLiveMarketplaceCatalogListings();
  const deletedIds = await getDeletedListingIds();
  let repaired = 0;
  for (const listing of listings) {
    if (deletedIds.has(listing.id) || !existingIds.has(listing.id)) continue;
    await upsertListingRow(listing);
    repaired += 1;
  }
  await setMarketplaceFlag(LIVE_LOCATION_REPAIR_KEY, LIVE_LOCATION_REPAIR_VERSION);
  if (repaired > 0) await bumpListingsCache();
  return repaired;
}

/**
 * Publish the professional live marketplace listings.
 * Inserts missing rows, and force-refreshes when catalog version bumps.
 * Never resurrects owner-deleted listing ids.
 * Vercel Production/Preview are opt-in via SOOQNA_LIVE_CATALOG=true
 * (Preview shares production Neon).
 */
export async function ensureLiveMarketplaceCatalogPublished(): Promise<number> {
  if (ensureInflight) return ensureInflight;

  ensureInflight = (async () => {
    try {
      // Always repair pinned locations for rows already in Neon.
      const repaired = await repairLiveCatalogLocations().catch((error) => {
        console.error(
          "[live-catalog] location repair skipped:",
          error instanceof Error ? error.message : error,
        );
        return 0;
      });

      if (!isLiveCatalogEnabled()) return repaired;

      const listings = getLiveMarketplaceCatalogListings();
      const deletedIds = await getDeletedListingIds();
      const eligible = listings.filter((listing) => !deletedIds.has(listing.id));
      const currentVersion = await getMarketplaceFlag(LIVE_CATALOG_VERSION_KEY);
      if (currentVersion !== LIVE_CATALOG_VERSION) {
        for (const listing of eligible) {
          await upsertListingRow(listing);
        }
        await setMarketplaceFlag(LIVE_CATALOG_VERSION_KEY, LIVE_CATALOG_VERSION);
        await bumpListingsCache();
        return eligible.length;
      }

      const inserted = await insertListingsIfMissing(eligible);
      if (inserted > 0) {
        await bumpListingsCache();
      }
      return inserted + repaired;
    } catch (error) {
      // Never take down public listing pages when Postgres quota/connectivity fails.
      console.error(
        "[live-catalog] ensure skipped:",
        error instanceof Error ? error.message : error,
      );
      return 0;
    } finally {
      ensureInflight = null;
    }
  })();
  return ensureInflight;
}

/**
 * Hard-delete curated live-mkt seed rows from the store.
 * Clears the publish version flag so a later opt-in re-publish starts clean.
 */
export async function removeLiveMarketplaceCatalog(): Promise<{
  action: "remove";
  affected: number;
}> {
  const affected = await deleteLiveMarketplaceListings();
  await setMarketplaceFlag(LIVE_CATALOG_VERSION_KEY, "");
  await setMarketplaceFlag(LIVE_CATALOG_RETIRED_FLAG, LIVE_CATALOG_VERSION);
  bumpListingsCache();
  return { action: "remove", affected };
}

/**
 * Publish live-mkt starters only into categories that have zero real
 * marketplace ads. Does not require SOOQNA_LIVE_CATALOG=true.
 */
export async function publishEmptyCategoryStarters(): Promise<{
  action: "publish-empty";
  categories: string[];
  affected: number;
}> {
  const { ensureEmptyCategoryStartersPublished } = await import(
    "@/services/listings/empty-category-starters"
  );
  const result = await ensureEmptyCategoryStartersPublished({ force: true });
  return { action: "publish-empty", ...result };
}
