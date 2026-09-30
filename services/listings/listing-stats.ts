import type { Listing, ListingStatus } from "@/types";
import {
  FIXTURE_LISTING_SQL,
  isConfirmedFixtureListing,
} from "@/services/listings/mock-catalog-policy";
import {
  ensureListingsTable,
  loadPersistedListings,
} from "@/services/listings/listing-persistence";
import {
  getOptionalPostgresPool,
  isPostgresQuotaOrUnavailableError,
  markPostgresUnavailable,
} from "@/services/db/postgres";
import {
  LIVE_MARKETPLACE_LISTING_SQL,
  isLiveCatalogListing,
} from "@/shared/listings/live-catalog-listing";
import {
  SHOWCASE_LISTING_SQL,
  isShowcaseListing,
} from "@/shared/listings/showcase-listing";

const TABLE = "marketplace_listings";

/**
 * SQL predicate: real user-posted marketplace rows only.
 * Always excludes showcase/demo, confirmed fixtures, and live-mkt seed —
 * matching {@link isMarketplaceListing}. Use for every public/admin COUNT.
 */
export const MARKETPLACE_LISTING_EXCLUSION_SQL = `(
  NOT ${FIXTURE_LISTING_SQL}
  AND NOT ${SHOWCASE_LISTING_SQL}
  AND NOT ${LIVE_MARKETPLACE_LISTING_SQL}
)`;

/**
 * User-posted marketplace rows for admin KPIs / desks / public badges.
 * Excludes showcase/demo, confirmed fixtures, and curated live-catalog seed.
 */
export function isMarketplaceListing(listing: {
  id?: string;
  slug?: string;
  isDemo?: boolean;
  source?: string;
  seller?: { id?: string; name?: string };
  title?: string;
}): boolean {
  if (isShowcaseListing(listing)) return false;
  if (isConfirmedFixtureListing(listing)) return false;
  if (isLiveCatalogListing(listing)) return false;
  return true;
}

export type MarketplaceListingStats = {
  /** All marketplace rows (any status), excluding demo/fixtures/live seed. */
  totalListings: number;
  /** User-posted active + reserved (excludes live-catalog seed). */
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  draftListings: number;
  expiredListings: number;
  soldListings: number;
  featuredListings: number;
  /** Showcase/demo + curated live-seed rows (for admin “تجريبي” views). */
  demoListings: number;
  /** Confirmed fixture rows still in storage. */
  fixtureListings: number;
};

const EMPTY_STATS: MarketplaceListingStats = {
  totalListings: 0,
  activeListings: 0,
  pendingListings: 0,
  rejectedListings: 0,
  draftListings: 0,
  expiredListings: 0,
  soldListings: 0,
  featuredListings: 0,
  demoListings: 0,
  fixtureListings: 0,
};

function statsFromRows(
  rows: Array<{
    status: string;
    isFeatured?: boolean;
    isDemo?: boolean;
    isFixture?: boolean;
    isLiveCatalog?: boolean;
  }>,
): MarketplaceListingStats {
  const stats = { ...EMPTY_STATS };
  for (const row of rows) {
    if (row.isDemo) {
      stats.demoListings += 1;
      continue;
    }
    if (row.isFixture) {
      stats.fixtureListings += 1;
      continue;
    }
    // Curated live seed is not user-posted — keep out of admin marketplace totals.
    if (row.isLiveCatalog) {
      stats.demoListings += 1;
      continue;
    }
    stats.totalListings += 1;
    if (row.isFeatured) stats.featuredListings += 1;
    const status = row.status as ListingStatus;
    if (status === "active" || status === "reserved") stats.activeListings += 1;
    else if (status === "pending_review") stats.pendingListings += 1;
    else if (status === "rejected") stats.rejectedListings += 1;
    else if (status === "draft") stats.draftListings += 1;
    else if (status === "expired") stats.expiredListings += 1;
    else if (status === "sold") stats.soldListings += 1;
  }
  return stats;
}

async function statsFromPostgres(): Promise<MarketplaceListingStats | null> {
  if (!(await ensureListingsTable())) return null;
  const pool = await getOptionalPostgresPool();
  if (!pool) return null;

  const result = await pool.query(
    `SELECT
       status,
       COALESCE(is_featured, false) AS is_featured,
       (${SHOWCASE_LISTING_SQL}) AS is_demo,
       (${FIXTURE_LISTING_SQL}) AS is_fixture,
       (${LIVE_MARKETPLACE_LISTING_SQL}) AS is_live_catalog
     FROM ${TABLE}`,
  );

  return statsFromRows(
    result.rows.map((row) => ({
      status: String(row.status ?? ""),
      isFeatured: Boolean(row.is_featured),
      isDemo: Boolean(row.is_demo),
      isFixture: Boolean(row.is_fixture),
      isLiveCatalog: Boolean(row.is_live_catalog),
    })),
  );
}

function statsFromStored(listings: Listing[]): MarketplaceListingStats {
  return statsFromRows(
    listings.map((listing) => ({
      status: listing.status,
      isFeatured: listing.isFeatured,
      isDemo: isShowcaseListing(listing),
      isFixture: isConfirmedFixtureListing(listing),
      isLiveCatalog: isLiveCatalogListing(listing),
    })),
  );
}

/**
 * Single source of truth for listing totals across admin KPIs, reports,
 * and the listings desk. Marketplace counts exclude showcase, fixtures,
 * and curated live-catalog seed. Admin reads do not auto-publish catalogs.
 */
export async function getMarketplaceListingStats(): Promise<MarketplaceListingStats> {
  try {
    const fromDb = await statsFromPostgres();
    if (fromDb) return fromDb;
  } catch (error) {
    if (!isPostgresQuotaOrUnavailableError(error)) throw error;
    markPostgresUnavailable(error);
  }
  const stored = await loadPersistedListings().catch(() => [] as Listing[]);
  return statsFromStored(stored);
}
