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
import { ensureLiveMarketplaceCatalogPublished } from "@/services/listings/live-marketplace-catalog.service";
import { ensureShowcaseCatalogPublished } from "@/services/listings/showcase-catalog.service";
import {
  SHOWCASE_LISTING_SQL,
  isShowcaseListing,
} from "@/shared/listings/showcase-listing";

const TABLE = "marketplace_listings";

/** Real marketplace rows — excludes showcase/demo and confirmed fixtures. */
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
  return true;
}

export type MarketplaceListingStats = {
  /** All marketplace rows (any status), excluding demo/fixtures. */
  totalListings: number;
  /** Publicly visible: active + reserved. Matches public catalog counts. */
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  draftListings: number;
  expiredListings: number;
  soldListings: number;
  featuredListings: number;
  /** Showcase/demo rows only (for admin “تجريبي” views). */
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

async function ensureCatalogs(): Promise<void> {
  await Promise.all([
    ensureShowcaseCatalogPublished().catch(() => undefined),
    ensureLiveMarketplaceCatalogPublished().catch(() => 0),
  ]);
}

function statsFromRows(
  rows: Array<{
    status: string;
    isFeatured?: boolean;
    isDemo?: boolean;
    isFixture?: boolean;
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
       (${FIXTURE_LISTING_SQL}) AS is_fixture
     FROM ${TABLE}`,
  );

  return statsFromRows(
    result.rows.map((row) => ({
      status: String(row.status ?? ""),
      isFeatured: Boolean(row.is_featured),
      isDemo: Boolean(row.is_demo),
      isFixture: Boolean(row.is_fixture),
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
    })),
  );
}

/**
 * Single source of truth for listing totals across admin KPIs, reports,
 * and the listings desk. Marketplace counts exclude showcase + fixtures.
 * `activeListings` matches public `countActivePublicListings`.
 */
export async function getMarketplaceListingStats(): Promise<MarketplaceListingStats> {
  await ensureCatalogs();
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
