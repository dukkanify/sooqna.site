import { getLiveMarketplaceCatalogListings } from "@/services/listings/live-marketplace-catalog";
import {
  getMarketplaceFlag,
  insertListingsIfMissing,
  setMarketplaceFlag,
  upsertListingRow,
} from "@/services/listings/listing-persistence";
import { bumpListingsCache } from "@/services/listings/listings-cache";

const LIVE_CATALOG_VERSION_KEY = "live_marketplace_catalog_version";
const LIVE_CATALOG_VERSION = "v5-all-car-brands";

let ensureInflight: Promise<number> | null = null;

/**
 * Publish the 100 professional live marketplace listings.
 * Inserts missing rows, and force-refreshes when catalog version bumps.
 */
export async function ensureLiveMarketplaceCatalogPublished(): Promise<number> {
  if (process.env.SOOQNA_LIVE_CATALOG === "false") return 0;
  if (ensureInflight) return ensureInflight;

  ensureInflight = (async () => {
    try {
      const listings = getLiveMarketplaceCatalogListings();
      const currentVersion = await getMarketplaceFlag(LIVE_CATALOG_VERSION_KEY);
      if (currentVersion !== LIVE_CATALOG_VERSION) {
        for (const listing of listings) {
          await upsertListingRow(listing);
        }
        await setMarketplaceFlag(LIVE_CATALOG_VERSION_KEY, LIVE_CATALOG_VERSION);
        await bumpListingsCache();
        return listings.length;
      }

      const inserted = await insertListingsIfMissing(listings);
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
