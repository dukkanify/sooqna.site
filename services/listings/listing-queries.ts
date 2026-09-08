import type { Listing, ListingSearchFilters } from "@/types";
import type { AdminListingRecord } from "@/types/domain/admin";
import { listingMatchesQuery } from "@/shared/listings/listing-specs";
import { getOptionalPostgresPool } from "@/services/db/postgres";
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

const TABLE = "marketplace_listings";

export type ListingQuerySlim = "card" | "suggest" | "full";

export type ListingQuery = {
  area?: string;
  categoryId?: string;
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
  status?: Listing["status"];
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
    if (sort === "price_asc") return first.price - second.price;
    if (sort === "price_desc") return second.price - first.price;
    const firstDate = first.postedAt ?? first.id;
    const secondDate = second.postedAt ?? second.id;
    return secondDate.localeCompare(firstDate);
  });
}

function matchesStructured(listing: Listing, query: ListingQuery): boolean {
  if (query.status && listing.status !== query.status) return false;
  if (query.categoryId && listing.categoryId !== query.categoryId) return false;
  if (query.sellerId && listing.seller.id !== query.sellerId) return false;
  if (query.excludeId && listing.id === query.excludeId) return false;
  if (query.featured && listing.isFeatured !== true) return false;
  if (query.condition && listing.condition !== query.condition) return false;
  const emirate = query.emirate ?? query.city;
  if (emirate && listing.emirate !== emirate && listing.city !== emirate) {
    return false;
  }
  if (query.area && listing.area !== query.area) return false;
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
  return true;
}

function shouldExcludeFixtures(query: ListingQuery): boolean {
  return query.includeFixtures !== true;
}

async function queryFromFile(query: ListingQuery): Promise<Listing[]> {
  const stored = await loadPersistedListings();
  const matched = stored.filter((listing) => {
    if (shouldExcludeFixtures(query) && isConfirmedFixtureListing(listing)) {
      return false;
    }
    return matchesStructured(listing, query);
  });
  const sorted = sortListings(matched, query.sort);
  const offset = query.offset ?? 0;
  const limited =
    typeof query.limit === "number"
      ? sorted.slice(offset, offset + query.limit)
      : sorted.slice(offset);
  return limited.map((listing) => applySlim(listing, query.slim));
}

export async function queryListings(query: ListingQuery = {}): Promise<Listing[]> {
  if (!(await ensureListingsTable())) {
    return queryFromFile(query);
  }
  const pool = await getOptionalPostgresPool();
  if (!pool) return queryFromFile(query);

  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };

  if (query.status) add("status = ?", query.status);
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
  if (query.area) add("payload->>'area' = ?", query.area);
  if (query.country) add("payload->>'country' = ?", query.country);
  if (typeof query.minPrice === "number") {
    add("(payload->>'price')::numeric >= ?", query.minPrice);
  }
  if (typeof query.maxPrice === "number") {
    add("(payload->>'price')::numeric <= ?", query.maxPrice);
  }
  if (shouldExcludeFixtures(query)) {
    where.push(`NOT ${FIXTURE_LISTING_SQL}`);
  }

  if (query.query?.trim()) {
    const pattern = likePattern(query.query);
    values.push(pattern);
    const idx = values.length;
    where.push(`(
      payload->>'title' ILIKE $${idx} ESCAPE '\\'
      OR payload->>'titleEnglish' ILIKE $${idx} ESCAPE '\\'
      OR payload->>'description' ILIKE $${idx} ESCAPE '\\'
      OR slug ILIKE $${idx} ESCAPE '\\'
      OR payload->>'city' ILIKE $${idx} ESCAPE '\\'
      OR payload->>'emirate' ILIKE $${idx} ESCAPE '\\'
      OR payload->>'area' ILIKE $${idx} ESCAPE '\\'
      OR COALESCE(payload->'categorySpecs','{}'::jsonb)::text ILIKE $${idx} ESCAPE '\\'
    )`);
  }

  const order =
    query.sort === "price_asc"
      ? "(payload->>'price')::numeric ASC NULLS LAST"
      : query.sort === "price_desc"
        ? "(payload->>'price')::numeric DESC NULLS LAST"
        : "COALESCE(posted_at, updated_at) DESC NULLS LAST";

  let sql = `SELECT payload FROM ${TABLE}`;
  if (where.length > 0) sql += ` WHERE ${where.join(" AND ")}`;
  sql += ` ORDER BY ${order}`;
  if (typeof query.limit === "number") {
    values.push(query.limit);
    sql += ` LIMIT $${values.length}`;
  }
  if (typeof query.offset === "number" && query.offset > 0) {
    values.push(query.offset);
    sql += ` OFFSET $${values.length}`;
  }

  const result = await pool.query(sql, values);
  const rows = result.rows
    .map((row) => row.payload as Listing)
    .filter(
      (listing) =>
        !shouldExcludeFixtures(query) || !isConfirmedFixtureListing(listing),
    );
  return rows.map((listing) => applySlim(listing, query.slim));
}

function countWhere(
  status?: Listing["status"],
  includeFixtures?: boolean,
): { sql: string; values: unknown[] } {
  const where: string[] = [];
  const values: unknown[] = [];
  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }
  if (includeFixtures !== true) {
    where.push(`NOT ${FIXTURE_LISTING_SQL}`);
  }
  return {
    sql: where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "",
    values,
  };
}

export async function countListingsByCategory(
  status?: Listing["status"],
  options?: { includeFixtures?: boolean },
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const includeFixtures = options?.includeFixtures === true;
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

  const stored = await loadPersistedListings();
  for (const listing of stored) {
    if (status && listing.status !== status) continue;
    if (!includeFixtures && isConfirmedFixtureListing(listing)) continue;
    counts.set(listing.categoryId, (counts.get(listing.categoryId) ?? 0) + 1);
  }
  return counts;
}

export async function countActiveListingsByCategory(): Promise<Map<string, number>> {
  return countListingsByCategory("active");
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
  const counts = new Map<string, number>();
  const add = (emirate: string) => {
    const cityId = EMIRATE_NAME_TO_CITY_ID[emirate.trim()];
    if (!cityId) return;
    counts.set(cityId, (counts.get(cityId) ?? 0) + 1);
  };

  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (pool) {
      const result = await pool.query(
        `SELECT COALESCE(payload->>'emirate', payload->>'city') AS emirate
         FROM ${TABLE}
         WHERE status = 'active' AND NOT ${FIXTURE_LISTING_SQL}`,
      );
      for (const row of result.rows) {
        if (typeof row.emirate === "string") add(row.emirate);
      }
      return counts;
    }
  }

  const stored = await loadPersistedListings();
  for (const listing of stored) {
    if (listing.status !== "active") continue;
    if (isConfirmedFixtureListing(listing)) continue;
    add(listing.emirate ?? listing.city);
  }
  return counts;
}

export async function countActivePublicListings(): Promise<number> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (pool) {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS c FROM ${TABLE}
         WHERE status = 'active' AND NOT ${FIXTURE_LISTING_SQL}`,
      );
      return Number(result.rows[0]?.c) || 0;
    }
  }
  const stored = await loadPersistedListings();
  return stored.filter(
    (listing) =>
      listing.status === "active" && !isConfirmedFixtureListing(listing),
  ).length;
}

export async function countListingsBySeller(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (pool) {
      const result = await pool.query(
        `SELECT seller_id, COUNT(*)::int AS c FROM ${TABLE} GROUP BY seller_id`,
      );
      for (const row of result.rows) {
        counts.set(String(row.seller_id), Number(row.c) || 0);
      }
      return counts;
    }
  }
  const stored = await loadPersistedListings();
  for (const listing of stored) {
    counts.set(listing.seller.id, (counts.get(listing.seller.id) ?? 0) + 1);
  }
  return counts;
}

export async function loadAdminListingRecords(): Promise<AdminListingRecord[]> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (pool) {
      const result = await pool.query(
        `SELECT
            id,
            slug,
            seller_id,
            category_id,
            status,
            is_featured,
            posted_at,
            payload->>'title' AS title,
            payload->>'city' AS city,
            COALESCE((payload->>'price')::numeric, 0) AS price,
            COALESCE(payload->>'currency', 'AED') AS currency,
            payload->'seller'->>'name' AS seller_name
         FROM ${TABLE}
         ORDER BY COALESCE(posted_at, updated_at) DESC NULLS LAST`,
      );
      return result.rows.map((row) => ({
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title ?? ""),
        sellerName: String(row.seller_name ?? ""),
        sellerId: String(row.seller_id),
        categoryId: String(row.category_id),
        price: Number(row.price) || 0,
        currency: String(row.currency ?? "AED"),
        status: row.status as AdminListingRecord["status"],
        isFeatured: Boolean(row.is_featured),
        postedAt:
          row.posted_at instanceof Date
            ? row.posted_at.toISOString()
            : String(row.posted_at ?? ""),
        city: String(row.city ?? ""),
      }));
    }
  }

  const stored = await loadPersistedListings();
  return stored.map((listing) => ({
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
    postedAt: listing.postedAt ?? "",
    city: listing.city,
  }));
}
