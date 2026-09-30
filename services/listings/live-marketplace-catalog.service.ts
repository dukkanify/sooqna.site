import { getLiveMarketplaceCatalogListings } from "@/services/listings/live-marketplace-catalog";
import {
  getDeletedListingIds,
  getMarketplaceFlag,
  insertListingsIfMissing,
  setMarketplaceFlag,
  upsertListingRow,
} from "@/services/listings/listing-persistence";
import { bumpListingsCache } from "@/services/listings/listings-cache";
import { isLiveCatalogEnabled } from "@/shared/listings/live-catalog-listing";

const LIVE_CATALOG_VERSION_KEY = "live_marketplace_catalog_version";
const LIVE_CATALOG_VERSION = "v9-relative-posted-at";

let ensureInflight: Promise<number> | null = null;

/**
 * Publish the professional live marketplace listings.
 * Inserts missing rows, and force-refreshes when catalog version bumps.
 * Never resurrects owner-deleted listing ids.
 * Production is opt-in via SOOQNA_LIVE_CATALOG=true.
 */
export async function ensureLiveMarketplaceCatalogPublished(): Promise<number> {
  if (!isLiveCatalogEnabled()) return 0;
  if (ensureInflight) return ensureInflight;

  ensureInflight = (async () => {
    try {
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
      return inserted;
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
