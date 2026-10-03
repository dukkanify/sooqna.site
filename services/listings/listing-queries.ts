import type { Listing, ListingSearchFilters } from "@/types";
import type { AdminListingRecord } from "@/types/domain/admin";
import { listingMatchesQuery } from "@/shared/listings/listing-specs";
import {
  listingMatchesSmartFilters,
  specMatchCandidates,
  specSqlPaths,
} from "@/shared/listings/listing-filter-match";
import { categoryIdsMatchingQuery } from "@/shared/listings/search-text";
import {
  getOptionalPostgresPool,
  isPostgresQuotaOrUnavailableError,
  markPostgresUnavailable,
} from "@/services/db/postgres";
import {
  ensureListingsTable,
  loadPersistedListings,
} from "@/services/listings/listing-persistence";
import {
  slimListingForCard,
  slimListingForSuggest,
} from "@/services/listings/listing-card-model";
import {
  FIXTURE_LISTING_SQL,
  isConfirmedFixtureListing,
} from "@/services/listings/mock-catalog-policy";
import { ensureLiveMarketplaceCatalogPublished } from "@/services/listings/live-marketplace-catalog.service";
import { ensureShowcaseCatalogPublished } from "@/services/listings/showcase-catalog.service";
import {
  SHOWCASE_LISTING_SQL,
  SHOWCASE_SOURCE,
  isShowcaseListing,
} from "@/shared/listings/showcase-listing";
import {
  LIVE_MARKETPLACE_LISTING_SQL,
  isLiveCatalogEnabled,
  isLiveCatalogListing,
} from "@/shared/listings/live-catalog-listing";
import {
  MARKETPLACE_LISTING_EXCLUSION_SQL,
  isMarketplaceListing,
} from "@/services/listings/listing-stats";
import { compareListingsWithFeaturedPriority } from "@/shared/listings/featured-page-rules";
import { syncLiveCatalogMedia } from "@/services/listings/live-marketplace-catalog";
import { dedupeListingsById } from "@/services/listings/public-catalog";
import {
  applyListingViewCounts,
  getListingViewScores,
} from "@/services/listings/listing-views-store";

const TABLE = "marketplace_listings";

/**
 * Browse/search exclusion: fixtures + showcase always; live-mkt when catalog OFF.
 * Prefer {@link marketplaceCountExclusionSql} for every COUNT / badge total.
 */
function publicCatalogExclusionSql(): string[] {
  const parts = [`NOT ${FIXTURE_LISTING_SQL}`, `NOT ${SHOWCASE_LISTING_SQL}`];
  if (!isLiveCatalogEnabled()) {
    parts.push(`NOT ${LIVE_MARKETPLACE_LISTING_SQL}`);
  }
  return parts;
}

/** Count/badge exclusion — always matches isMarketplaceListing (no live-mkt). */
function marketplaceCountExclusionSql(): string {
  return MARKETPLACE_LISTING_EXCLUSION_SQL;
}

export type ListingQuerySlim = "card" | "suggest" | "full";

export type ListingQuery = {
  area?: string;
  categoryId?: string;
  categorySpecs?: Record<string, string>;
  city?: string;
  condition?: Listing["condition"];
  country?: string;
  emirate?: string;
  excludeId?: string;
  featured?: boolean;
  /** Owner/admin reads. Public catalog defaults to excluding confirmed fixtures. */
  includeFixtures?: boolean;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  offset?: number;
  query?: string;
  sellerId?: string;
  slim?: ListingQuerySlim;
  sort?: ListingSearchFilters["sort"];
  specMax?: Record<string, number>;
  specMin?: Record<string, number>;
  status?: Listing["status"];
  subcategory?: string;
};

function omitUrgent(listing: Listing): Listing {
  const copy = { ...listing };
  delete copy.isUrgent;
  return copy;
}

function applySlim(listing: Listing, slim: ListingQuerySlim | undefined): Listing {
  const next =
    slim === "card"
      ? slimListingForCard(listing)
      : slim === "suggest"
        ? slimListingForSuggest(listing)
        : listing;
  return omitUrgent(next);
}

function likePattern(raw: string): string {
  const trimmed = raw.trim().slice(0, 80);
  return `%${trimmed.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

function sortListings(listings: Listing[], sort?: ListingSearchFilters["sort"]) {
  return [...listings].sort((first, second) => {
    const firstDemo = first.source === SHOWCASE_SOURCE || first.isDemo === true ? 1 : 0;
    const secondDemo = second.source === SHOWCASE_SOURCE || second.isDemo === true ? 1 : 0;
    if (firstDemo !== secondDemo) return firstDemo - secondDemo;
    return compareListingsWithFeaturedPriority(first, second, sort);
  });
}

function matchesStructured(listing: Listing, query: ListingQuery): boolean {
  if (query.status) {
    const ok =
      listing.status === query.status ||
      (query.status === "active" &&
        (listing.status === "active" || listing.status === "reserved"));
    if (!ok) return false;
  }
  if (query.categoryId && listing.categoryId !== query.categoryId) return false;
  if (query.sellerId && listing.seller.id !== query.sellerId) return false;
  if (query.excludeId && listing.id === query.excludeId) return false;
  if (query.featured && listing.isFeatured !== true) return false;
  if (query.condition && listing.condition !== query.condition) return false;
  const emirate = query.emirate ?? query.city;
  if (emirate && listing.emirate !== emirate && listing.city !== emirate) {
    return false;
  }
  if (query.country && listing.country !== query.country) return false;
  if (typeof query.minPrice === "number" && listing.price < query.minPrice) {
    return false;
  }
  if (typeof query.maxPrice === "number" && listing.price > query.maxPrice) {
    return false;
  }
  if (query.query?.trim() && !listingMatchesQuery(listing, query.query)) {
    return false;
  }
  return listingMatchesSmartFilters(listing, {
    area: query.area,
    categorySpecs: query.categorySpecs,
    specMax: query.specMax,
    specMin: query.specMin,
    subcategory: query.subcategory,
  });
}

function shouldExcludeFixtures(query: ListingQuery): boolean {
  return query.includeFixtures !== true;
}

function isHiddenFromPublicCatalog(listing: Listing): boolean {
  if (isConfirmedFixtureListing(listing) || isShowcaseListing(listing)) {
    return true;
  }
  // When live catalog is disabled (production default), hide seed inventory
  // that may already exist in the shared Neon DB.
  if (!isLiveCatalogEnabled() && isLiveCatalogListing(listing)) {
    return true;
  }
  return false;
}

/** Same visibility + structured filters as the in-memory catalog, then unique ids. */
function finalizePublicCatalogRows(
  listings: Listing[],
  query: ListingQuery,
): Listing[] {
  const matched = listings.filter((listing) => {
    if (shouldExcludeFixtures(query) && isHiddenFromPublicCatalog(listing)) {
      return false;
    }
    return matchesStructured(listing, query);
  });
  return dedupeListingsById(sortListings(matched, query.sort));
}

async function ensureCatalogsForPublicRead(): Promise<void> {
  await Promise.all([
    ensureShowcaseCatalogPublished(),
    ensureLiveMarketplaceCatalogPublished().catch(() => 0),
  ]);
}

async function queryFromFile(query: ListingQuery): Promise<Listing[]> {
  const stored = syncLiveCatalogMedia(await loadPersistedListings());
  const matched = finalizePublicCatalogRows(stored, query);
  const offset = query.offset ?? 0;
  const limited =
    typeof query.limit === "number"
      ? matched.slice(offset, offset + query.limit)
      : matched.slice(offset);
  const withViews = await applyListingViewCounts(limited);
  return withViews.map((listing) => applySlim(listing, query.slim));
}

function listingSqlFilter(query: ListingQuery): { values: unknown[]; where: string[] } {
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };

  if (query.status) {
    if (query.status === "active") {
      where.push(
        `COALESCE(NULLIF(payload->>'status', ''), status) IN ('active', 'reserved')`,
      );
    } else {
      add("COALESCE(NULLIF(payload->>'status', ''), status) = ?", query.status);
    }
  }
  if (query.categoryId) add("category_id = ?", query.categoryId);
  if (query.sellerId) add("seller_id = ?", query.sellerId);
  if (query.excludeId) add("id <> ?", query.excludeId);
  if (query.featured) add("is_featured = ?", true);
  if (query.condition) add("payload->>'condition' = ?", query.condition);
  const emirate = query.emirate ?? query.city;
  if (emirate) {
    values.push(emirate);
    const idx = values.length;
    where.push(`(payload->>'emirate' = $${idx} OR payload->>'city' = $${idx})`);
  }
  if (query.country) add("payload->>'country' = ?", query.country);
  if (typeof query.minPrice === "number") {
    add("(payload->>'price')::numeric >= ?", query.minPrice);
  }
  if (typeof query.maxPrice === "number") {
    add("(payload->>'price')::numeric <= ?", query.maxPrice);
  }
  if (query.subcategory) {
    const candidates = specMatchCandidates(query.subcategory);
    if (candidates.length > 0) {
      values.push(candidates);
      const idx = values.length;
      where.push(`(
        regexp_replace(lower(coalesce(payload->>'subcategory', '')), '\\s+', '', 'g') = ANY($${idx}::text[])
        OR regexp_replace(lower(coalesce(payload->'categorySpecs'->>'subcategory', '')), '\\s+', '', 'g') = ANY($${idx}::text[])
      )`);
    }
  }
  if (query.area?.trim()) {
    const pattern = likePattern(query.area);
    values.push(pattern);
    const idx = values.length;
    where.push(`(
        payload->>'area' ILIKE $${idx} ESCAPE '\\'
        OR payload->'categorySpecs'->>'city' ILIKE $${idx} ESCAPE '\\'
        OR payload->'categorySpecs'->>'community' ILIKE $${idx} ESCAPE '\\'
        OR payload->'categorySpecs'->>'coverageArea' ILIKE $${idx} ESCAPE '\\'
        OR payload->'categorySpecs'->>'location' ILIKE $${idx} ESCAPE '\\'
      )`);
  }
  for (const [key, wanted] of Object.entries(query.categorySpecs ?? {})) {
    const paths = specSqlPaths(key);
    const candidates = specMatchCandidates(wanted);
    if (!paths.length || candidates.length === 0) continue;
    values.push(candidates);
    const idx = values.length;
    const ors = paths.map(
      (path) =>
        `regexp_replace(lower(coalesce(${path}, '')), '\\s+', '', 'g') = ANY($${idx}::text[])`,
    );
    where.push(`(${ors.join(" OR ")})`);
  }
  for (const [key, min] of Object.entries(query.specMin ?? {})) {
    const paths = specSqlPaths(key);
    if (!paths.length || !Number.isFinite(min)) continue;
    add(
      `COALESCE(${paths
        .map(
          (path) =>
            `NULLIF(regexp_replace(coalesce(${path}, ''), '[^0-9.]', '', 'g'), '')::numeric`,
        )
        .join(", ")}) >= ?`,
      min,
    );
  }
  for (const [key, max] of Object.entries(query.specMax ?? {})) {
    const paths = specSqlPaths(key);
    if (!paths.length || !Number.isFinite(max)) continue;
    add(
      `COALESCE(${paths
        .map(
          (path) =>
            `NULLIF(regexp_replace(coalesce(${path}, ''), '[^0-9.]', '', 'g'), '')::numeric`,
        )
        .join(", ")}) <= ?`,
      max,
    );
  }
  if (shouldExcludeFixtures(query)) {
    where.push(...publicCatalogExclusionSql());
  }

  if (query.query?.trim()) {
    const rawQuery = query.query.trim();
    const pattern = likePattern(rawQuery);
    values.push(pattern);
    const textIdx = values.length;
    const matchedCategoryIds = categoryIdsMatchingQuery(rawQuery);
    let categoryClause = "";
    if (matchedCategoryIds.length > 0) {
      values.push(matchedCategoryIds);
      const categoryIdx = values.length;
      // Generic Arabic queries like «سيارات» must hit the cars vertical even when
      // titles are brand/model only (تويوتا كامري) and never contain the word.
      categoryClause = ` OR category_id = ANY($${categoryIdx}::text[])`;
    }
    where.push(`(
      payload->>'title' ILIKE $${textIdx} ESCAPE '\\'
      OR payload->>'titleEnglish' ILIKE $${textIdx} ESCAPE '\\'
      OR payload->>'description' ILIKE $${textIdx} ESCAPE '\\'
      OR payload->>'descriptionEnglish' ILIKE $${textIdx} ESCAPE '\\'
      OR slug ILIKE $${textIdx} ESCAPE '\\'
      OR payload->>'city' ILIKE $${textIdx} ESCAPE '\\'
      OR payload->>'emirate' ILIKE $${textIdx} ESCAPE '\\'
      OR payload->>'area' ILIKE $${textIdx} ESCAPE '\\'
      OR payload->>'subcategory' ILIKE $${textIdx} ESCAPE '\\'
      OR COALESCE(payload->'categorySpecs','{}'::jsonb)::text ILIKE $${textIdx} ESCAPE '\\'
      ${categoryClause}
    )`);
  }

  return { values, where };
}

export async function queryListings(query: ListingQuery = {}): Promise<Listing[]> {
  await ensureCatalogsForPublicRead();
  if (!(await ensureListingsTable())) {
    return queryFromFile(query);
  }
  const pool = await getOptionalPostgresPool();
  if (!pool) return queryFromFile(query);

  try {
    const { where, values } = listingSqlFilter(query);

    const showcaseLast = `(CASE WHEN COALESCE(payload->>'source','') = '${SHOWCASE_SOURCE}' THEN 1 ELSE 0 END) ASC`;
    const featuredFirst = `(CASE
      WHEN COALESCE(is_featured, false) = true
       AND (
         COALESCE(payload->>'featuredUntil', '') = ''
         OR (payload->>'featuredUntil')::timestamptz > NOW()
       )
      THEN 0 ELSE 1 END) ASC`;
    const featuredRecency = `(CASE
      WHEN COALESCE(is_featured, false) = true
       AND (
         COALESCE(payload->>'featuredUntil', '') = ''
         OR (payload->>'featuredUntil')::timestamptz > NOW()
       )
      THEN COALESCE((payload->>'featuredUntil')::timestamptz, '-infinity'::timestamptz)
      ELSE '-infinity'::timestamptz
    END) DESC`;
    const secondary =
      query.sort === "price_asc"
        ? `(payload->>'price')::numeric ASC NULLS LAST`
        : query.sort === "price_desc"
          ? `(payload->>'price')::numeric DESC NULLS LAST`
          : `COALESCE(posted_at, updated_at) DESC NULLS LAST`;
    const order = `${showcaseLast}, ${featuredFirst}, ${featuredRecency}, ${secondary}`;

    let sql = `SELECT payload FROM ${TABLE}`;
    if (where.length > 0) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY ${order}`;
    const want =
      typeof query.limit === "number"
        ? Math.max(0, query.limit) + Math.max(0, query.offset ?? 0)
        : undefined;
    // Over-fetch so payload visibility / unique-id filters can drop seed rows
    // without emptying home while category pages still have ads.
    if (typeof want === "number") {
      const overFetch = Math.min(Math.max(want * 5 + 40, want), 800);
      values.push(overFetch);
      sql += ` LIMIT $${values.length}`;
    }

    const result = await pool.query(sql, values);
    const rows = syncLiveCatalogMedia(
      result.rows.map((row) => row.payload as Listing),
    );
    const finalized = finalizePublicCatalogRows(rows, query);
    const offset = query.offset ?? 0;
    const limited =
      typeof query.limit === "number"
        ? finalized.slice(offset, offset + query.limit)
        : finalized.slice(offset);
    const withViews = await applyListingViewCounts(limited);
    return withViews.map((listing) => applySlim(listing, query.slim));
  } catch (error) {
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
      return queryFromFile(query);
    }
    throw error;
  }
}

export async function countMatchingListings(query: ListingQuery = {}): Promise<number> {
  await ensureCatalogsForPublicRead();
  const countable: ListingQuery = { ...query };
  delete countable.limit;
  delete countable.offset;
  delete countable.slim;

  const fromStored = async () => {
    const stored = syncLiveCatalogMedia(await loadPersistedListings());
    return finalizePublicCatalogRows(stored, countable).length;
  };

  if (!(await ensureListingsTable())) {
    return fromStored();
  }
  const pool = await getOptionalPostgresPool();
  if (!pool) return fromStored();

  try {
    const { where, values } = listingSqlFilter(countable);
    // Same payload visibility, structured filters, and unique-id rules as queryListings.
    let sql = `SELECT payload FROM ${TABLE}`;
    if (where.length > 0) sql += ` WHERE ${where.join(" AND ")}`;
    const result = await pool.query(sql, values);
    const rows = syncLiveCatalogMedia(
      result.rows.map((row) => row.payload as Listing),
    );
    return finalizePublicCatalogRows(rows, countable).length;
  } catch (error) {
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
      return fromStored();
    }
    throw error;
  }
}

function countWhere(
  status?: Listing["status"] | Listing["status"][],
  includeFixtures?: boolean,
): { sql: string; values: unknown[] } {
  const where: string[] = [];
  const values: unknown[] = [];
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    const column = `COALESCE(NULLIF(payload->>'status', ''), status)`;
    if (statuses.length === 1) {
      values.push(statuses[0]);
      where.push(`${column} = $${values.length}`);
    } else {
      const placeholders = statuses.map((entry) => {
        values.push(entry);
        return `$${values.length}`;
      });
      where.push(`${column} IN (${placeholders.join(", ")})`);
    }
  }
  if (includeFixtures !== true) {
    // Counts must match admin KPIs — always exclude live-mkt seed.
    where.push(marketplaceCountExclusionSql());
  }
  return {
    sql: where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "",
    values,
  };
}

function statusMatches(
  listingStatus: Listing["status"],
  status?: Listing["status"] | Listing["status"][],
): boolean {
  if (!status) return true;
  if (Array.isArray(status)) return status.includes(listingStatus);
  return listingStatus === status;
}

export async function countListingsByCategory(
  status?: Listing["status"] | Listing["status"][],
  options?: { includeFixtures?: boolean },
): Promise<Map<string, number>> {
  await ensureCatalogsForPublicRead();
  const counts = new Map<string, number>();
  const includeFixtures = options?.includeFixtures === true;
  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        const { sql, values } = countWhere(status, includeFixtures);
        const result = await pool.query(
          `SELECT category_id, COUNT(*)::int AS c
         FROM ${TABLE}${sql}
         GROUP BY category_id`,
          values,
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

  const stored = await loadPersistedListings();
  for (const listing of stored) {
    if (!statusMatches(listing.status, status)) continue;
    if (!includeFixtures && !isMarketplaceListing(listing)) continue;
    counts.set(listing.categoryId, (counts.get(listing.categoryId) ?? 0) + 1);
  }
  return counts;
}

/** Public badge counts — active + reserved real marketplace only (matches admin KPI). */
export async function countActiveListingsByCategory(): Promise<Map<string, number>> {
  return countListingsByCategory(["active", "reserved"]);
}

const EMIRATE_NAME_TO_CITY_ID: Record<string, string> = {
  دبي: "dubai",
  "أبوظبي": "abu-dhabi",
  الشارقة: "sharjah",
  عجمان: "ajman",
  "أم القيوين": "umm-al-quwain",
  "رأس الخيمة": "ras-al-khaimah",
  الفجيرة: "fujairah",
  dubai: "dubai",
  "abu-dhabi": "abu-dhabi",
  sharjah: "sharjah",
  ajman: "ajman",
  "umm-al-quwain": "umm-al-quwain",
  rak: "ras-al-khaimah",
  "ras-al-khaimah": "ras-al-khaimah",
  fujairah: "fujairah",
};

export async function countActiveListingsByEmirate(): Promise<Map<string, number>> {
  await ensureCatalogsForPublicRead();
  const counts = new Map<string, number>();
  const add = (emirate: string) => {
    const cityId = EMIRATE_NAME_TO_CITY_ID[emirate.trim()];
    if (!cityId) return;
    counts.set(cityId, (counts.get(cityId) ?? 0) + 1);
  };

  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        const result = await pool.query(
          `SELECT COALESCE(payload->>'emirate', payload->>'city') AS emirate
         FROM ${TABLE}
         WHERE COALESCE(NULLIF(payload->>'status', ''), status) IN ('active', 'reserved') AND ${marketplaceCountExclusionSql()}`,
        );
        for (const row of result.rows) {
          if (typeof row.emirate === "string") add(row.emirate);
        }
        return counts;
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
    add(listing.emirate ?? listing.city);
  }
  return counts;
}

/**
 * Public “active marketplace” total — same definition as admin
 * `getMarketplaceListingStats().activeListings` (active+reserved, no seeds).
 */
export async function countActivePublicListings(): Promise<number> {
  await ensureCatalogsForPublicRead();
  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        const result = await pool.query(
          `SELECT COUNT(*)::int AS c FROM ${TABLE}
         WHERE COALESCE(NULLIF(payload->>'status', ''), status) IN ('active', 'reserved') AND ${marketplaceCountExclusionSql()}`,
        );
        return Number(result.rows[0]?.c) || 0;
      }
    }
  } catch (error) {
    if (!isPostgresQuotaOrUnavailableError(error)) throw error;
    markPostgresUnavailable(error);
  }
  const stored = await loadPersistedListings();
  return stored.filter(
    (listing) =>
      (listing.status === "active" || listing.status === "reserved") &&
      isMarketplaceListing(listing),
  ).length;
}

export async function countListingsBySeller(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        const result = await pool.query(
          `SELECT seller_id, COUNT(*)::int AS c
           FROM ${TABLE}
           WHERE ${marketplaceCountExclusionSql()}
           GROUP BY seller_id`,
        );
        for (const row of result.rows) {
          counts.set(String(row.seller_id), Number(row.c) || 0);
        }
        return counts;
      }
    }
  } catch (error) {
    if (!isPostgresQuotaOrUnavailableError(error)) throw error;
    markPostgresUnavailable(error);
  }
  const stored = await loadPersistedListings();
  for (const listing of stored) {
    if (!isMarketplaceListing(listing)) continue;
    counts.set(listing.seller.id, (counts.get(listing.seller.id) ?? 0) + 1);
  }
  return counts;
}

export async function loadAdminListingRecords(): Promise<AdminListingRecord[]> {
  // Read-only: do not auto-publish showcase/live catalogs into the desk.
  const viewScores = await getListingViewScores();
  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        const result = await pool.query(
          `SELECT
            id,
            slug,
            seller_id,
            category_id,
            COALESCE(NULLIF(payload->>'status', ''), status) AS status,
            is_featured,
            posted_at,
            payload->>'title' AS title,
            payload->>'city' AS city,
            payload->>'emirate' AS emirate,
            payload->>'area' AS area,
            payload->>'imageUrl' AS image_url,
            payload->>'featuredUntil' AS featured_until,
            COALESCE((payload->>'price')::numeric, 0) AS price,
            COALESCE(payload->>'currency', 'AED') AS currency,
            payload->'seller'->>'name' AS seller_name,
            COALESCE((payload->>'isDemo')::boolean, false) AS is_demo,
            payload->>'source' AS source
         FROM ${TABLE}
         ORDER BY
           (CASE
              WHEN ${SHOWCASE_LISTING_SQL}
                OR COALESCE((payload->>'isDemo')::boolean, false)
              THEN 1 ELSE 0
            END) ASC,
           COALESCE(posted_at, updated_at) DESC NULLS LAST`,
        );
        return result.rows.map((row) => {
          const id = String(row.id);
          const slug = String(row.slug);
          return {
            id,
            slug,
            title: String(row.title ?? ""),
            sellerName: String(row.seller_name ?? ""),
            sellerId: String(row.seller_id),
            categoryId: String(row.category_id),
            price: Number(row.price) || 0,
            currency: String(row.currency ?? "AED"),
            status: row.status as AdminListingRecord["status"],
            isFeatured: Boolean(row.is_featured),
            featuredUntil: row.featured_until
              ? String(row.featured_until)
              : undefined,
            postedAt:
              row.posted_at instanceof Date
                ? row.posted_at.toISOString()
                : String(row.posted_at ?? ""),
            city: String(row.city ?? ""),
            emirate: row.emirate ? String(row.emirate) : undefined,
            area: row.area ? String(row.area) : undefined,
            imageUrl: row.image_url ? String(row.image_url) : undefined,
            views: viewScores.get(id) ?? 0,
            isDemo:
              Boolean(row.is_demo) ||
              String(row.source ?? "") === SHOWCASE_SOURCE,
            isFixture: isConfirmedFixtureListing({ id, slug }),
            source: row.source ? String(row.source) : undefined,
          };
        });
      }
    }
  } catch (error) {
    if (!isPostgresQuotaOrUnavailableError(error)) throw error;
    markPostgresUnavailable(error);
  }

  const stored = await loadPersistedListings();
  return stored
    .map((listing) => ({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      sellerName: listing.seller.name,
      sellerId: listing.seller.id,
      categoryId: listing.categoryId,
      price: listing.price,
      currency: listing.currency,
      status: listing.status,
      isFeatured: listing.isFeatured,
      featuredUntil: listing.featuredUntil,
      postedAt: listing.postedAt ?? "",
      city: listing.city,
      emirate: listing.emirate,
      area: listing.area,
      imageUrl: listing.imageUrl ?? listing.images?.[0],
      views: viewScores.get(listing.id) ?? listing.views ?? 0,
      isDemo: listing.isDemo === true || listing.source === SHOWCASE_SOURCE,
      isFixture: isConfirmedFixtureListing(listing),
      source: listing.source,
    }))
    .sort((a, b) => {
      const aDemo = a.isDemo || a.isFixture ? 1 : 0;
      const bDemo = b.isDemo || b.isFixture ? 1 : 0;
      if (aDemo !== bDemo) return aDemo - bDemo;
      const aTime = Date.parse(a.postedAt) || 0;
      const bTime = Date.parse(b.postedAt) || 0;
      return bTime - aTime;
    });
}
