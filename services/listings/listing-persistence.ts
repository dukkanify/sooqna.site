import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  marketplaceListings,
  marketplaceUserListings,
} from "@/mock/listings.mock";
import { getDurableAuthDir } from "@/services/auth/user-persistence";
import {
  getOptionalPostgresPool,
  isPostgresQuotaOrUnavailableError,
  markPostgresUnavailable,
} from "@/services/db/postgres";
import {
  allowMockCatalogSeed,
  isConfirmedFixtureListing,
} from "@/services/listings/mock-catalog-policy";
import {
  SHOWCASE_FLAG_KEY,
  SHOWCASE_SOURCE,
  type ShowcaseCatalogFlag,
} from "@/shared/listings/showcase-listing";
import type { Listing } from "@/types";

const TABLE = "marketplace_listings";
const FLAGS_TABLE = "marketplace_flags";
const FILE = "sooqna-listings.json";
const FLAGS_FILE = "sooqna-marketplace-flags.json";

let postgresReady = false;

export async function ensureListingsTable(): Promise<boolean> {
  const pool = await getOptionalPostgresPool();
  if (!pool) return false;
  if (postgresReady) return true;
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      seller_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      status TEXT NOT NULL,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      posted_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payload JSONB NOT NULL
    )
  `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS marketplace_listings_status_idx ON ${TABLE} (status)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS marketplace_listings_seller_idx ON ${TABLE} (seller_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS marketplace_listings_category_idx ON ${TABLE} (category_id)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS marketplace_listings_status_posted_idx
     ON ${TABLE} (status, posted_at DESC NULLS LAST)`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS marketplace_listings_status_featured_idx
     ON ${TABLE} (status, is_featured)
     WHERE status = 'active'`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS marketplace_listings_status_category_posted_idx
     ON ${TABLE} (status, category_id, posted_at DESC NULLS LAST)`,
    );
    await pool.query(`
    CREATE TABLE IF NOT EXISTS ${FLAGS_TABLE} (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
    postgresReady = true;
    return true;
  } catch (error) {
    postgresReady = false;
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
      return false;
    }
    throw error;
  }
}

function seedListings(): Listing[] {
  const byId = new Map<string, Listing>();
  for (const listing of [...marketplaceListings, ...marketplaceUserListings]) {
    byId.set(listing.id, { ...listing });
  }
  const seeded = Array.from(byId.values());
  for (const listing of seeded.slice(0, 3)) {
    listing.status = "pending_review";
  }
  return seeded;
}

function filePath(): string {
  return path.join(getDurableAuthDir(), FILE);
}

async function readJsonFile(): Promise<Listing[] | null> {
  try {
    const raw = await readFile(filePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Listing[]) : null;
  } catch {
    return null;
  }
}

async function writeJsonFile(listings: Listing[]): Promise<void> {
  const target = filePath();
  await mkdir(path.dirname(target), { recursive: true });
  const payload = JSON.stringify(listings, null, 2);
  const tempPath = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, payload, "utf8");
  await rename(tempPath, target);
}

export async function upsertListingRow(listing: Listing): Promise<void> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) throw new Error("LISTINGS_STORE_UNAVAILABLE");

    await pool.query(
      `INSERT INTO ${TABLE} (
          id, slug, seller_id, category_id, status, is_featured,
          posted_at, expires_at, updated_at, payload
        ) VALUES (
          $1,$2,$3,$4,$5,$6,
          $7::timestamptz,$8::timestamptz,NOW(),$9::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          seller_id = EXCLUDED.seller_id,
          category_id = EXCLUDED.category_id,
          status = EXCLUDED.status,
          is_featured = EXCLUDED.is_featured,
          posted_at = EXCLUDED.posted_at,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW(),
          payload = EXCLUDED.payload`,
      [
        listing.id,
        listing.slug,
        listing.seller.id,
        listing.categoryId,
        listing.status,
        Boolean(listing.isFeatured),
        listing.postedAt ?? null,
        listing.expiresAt ?? null,
        JSON.stringify(listing),
      ],
    );
    return;
  }

  const stored = (await readJsonFile()) ?? [];
  const index = stored.findIndex((item) => item.id === listing.id);
  if (index >= 0) {
    stored[index] = listing;
  } else {
    stored.unshift(listing);
  }
  await writeJsonFile(stored);
}

export async function persistAllListings(listings: Listing[]): Promise<void> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) throw new Error("LISTINGS_STORE_UNAVAILABLE");

    // Upsert each row. Removals go through deleteListingRow so a stale
    // snapshot cannot wipe listings created by another instance.
    for (const listing of listings) {
      await pool.query(
        `INSERT INTO ${TABLE} (
          id, slug, seller_id, category_id, status, is_featured,
          posted_at, expires_at, updated_at, payload
        ) VALUES (
          $1,$2,$3,$4,$5,$6,
          $7::timestamptz,$8::timestamptz,NOW(),$9::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          seller_id = EXCLUDED.seller_id,
          category_id = EXCLUDED.category_id,
          status = EXCLUDED.status,
          is_featured = EXCLUDED.is_featured,
          posted_at = EXCLUDED.posted_at,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW(),
          payload = EXCLUDED.payload`,
        [
          listing.id,
          listing.slug,
          listing.seller.id,
          listing.categoryId,
          listing.status,
          Boolean(listing.isFeatured),
          listing.postedAt ?? null,
          listing.expiresAt ?? null,
          JSON.stringify(listing),
        ],
      );
    }

    return;
  }

  await writeJsonFile(listings);
}

export async function loadListingBySlug(slug: string): Promise<Listing | null> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) return null;
    const result = await pool.query(
      `SELECT payload FROM ${TABLE} WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return (result.rows[0]?.payload as Listing) ?? null;
  }

  const stored = await readJsonFile();
  return stored?.find((item) => item.slug === slug) ?? null;
}

export async function loadListingById(id: string): Promise<Listing | null> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) return null;
    const result = await pool.query(
      `SELECT payload FROM ${TABLE} WHERE id = $1 OR slug = $1 LIMIT 1`,
      [id],
    );
    return (result.rows[0]?.payload as Listing) ?? null;
  }

  const stored = await readJsonFile();
  return stored?.find((item) => item.id === id || item.slug === id) ?? null;
}

export async function deleteListingRow(id: string): Promise<boolean> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) throw new Error("LISTINGS_STORE_UNAVAILABLE");
    const result = await pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return Boolean((result as { rowCount?: number }).rowCount);
  }

  const stored = (await readJsonFile()) ?? [];
  const next = stored.filter((item) => item.id !== id);
  if (next.length === stored.length) return false;
  await writeJsonFile(next);
  return true;
}

export async function loadPersistedListings(): Promise<Listing[]> {
  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (!pool) return await loadCatalogWithoutPostgres();
      try {
        const result = await pool.query(
          `SELECT payload FROM ${TABLE} ORDER BY COALESCE(posted_at, updated_at) DESC`,
        );
        if (result.rows.length === 0) {
          if (!allowMockCatalogSeed()) return await loadCatalogWithoutPostgres();
          const seeded = seedListings();
          await persistAllListings(seeded);
          return seeded;
        }
        return result.rows.map((row) => row.payload as Listing);
      } catch (error) {
        if (isPostgresQuotaOrUnavailableError(error)) {
          markPostgresUnavailable(error);
          return await loadCatalogWithoutPostgres();
        }
        throw error;
      }
    }
  } catch (error) {
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
      return await loadCatalogWithoutPostgres();
    }
    throw error;
  }

  const stored = await readJsonFile();
  if (!stored || stored.length === 0) {
    return await loadCatalogWithoutPostgres();
  }
  return stored;
}

/** When Postgres is down, serve the built-in live/showcase catalog so the site stays public. */
async function loadCatalogWithoutPostgres(): Promise<Listing[]> {
  if (allowMockCatalogSeed()) {
    const seeded = seedListings();
    try {
      await writeJsonFile(seeded);
    } catch {
      // /tmp or durable dir may be unavailable — still return in-memory seed.
    }
    return seeded;
  }

  const [{ getLiveMarketplaceCatalogListings }, { getShowcaseCatalogListings }] =
    await Promise.all([
      import("@/services/listings/live-marketplace-catalog"),
      import("@/services/listings/showcase-catalog"),
    ]);
  const byId = new Map<string, Listing>();
  for (const listing of getLiveMarketplaceCatalogListings()) {
    byId.set(listing.id, listing);
  }
  for (const listing of getShowcaseCatalogListings()) {
    if (!byId.has(listing.id)) byId.set(listing.id, listing);
  }
  return Array.from(byId.values());
}

export async function deleteMockSeedListings(): Promise<{
  removedIds: string[];
  remainingSeed: number;
}> {
  const removedIds: string[] = [];

  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) {
      return { removedIds, remainingSeed: 0 };
    }
    const existing = await pool.query(
      `SELECT id, slug, payload FROM ${TABLE}`,
    );
    const seedIds = existing.rows
      .filter((row) => {
        const payload = (row.payload ?? {}) as Listing;
        return isConfirmedFixtureListing({
          id: String(row.id),
          slug: String(row.slug || payload.slug || ""),
          title: payload.title,
          seller: payload.seller,
        });
      })
      .map((row) => String(row.id));
    if (seedIds.length > 0) {
      await pool.query(`DELETE FROM ${TABLE} WHERE id = ANY($1::text[])`, [
        seedIds,
      ]);
      removedIds.push(...seedIds);
    }
    const leftover = await pool.query(`SELECT id, slug, payload FROM ${TABLE}`);
    const remainingSeed = leftover.rows.filter((row) => {
      const payload = (row.payload ?? {}) as Listing;
      return isConfirmedFixtureListing({
        id: String(row.id),
        slug: String(row.slug || payload.slug || ""),
        title: payload.title,
        seller: payload.seller,
      });
    }).length;
    return { removedIds, remainingSeed };
  }

  const stored = (await readJsonFile()) ?? [];
  const kept: Listing[] = [];
  for (const listing of stored) {
    if (isConfirmedFixtureListing(listing)) {
      removedIds.push(listing.id);
    } else {
      kept.push(listing);
    }
  }
  await writeJsonFile(kept);
  return {
    removedIds,
    remainingSeed: kept.filter((item) => isConfirmedFixtureListing(item)).length,
  };
}

const SHOWCASE_WHERE = `(payload->>'source' = '${SHOWCASE_SOURCE}' OR id LIKE 'showcase-%')`;

function listingRowValues(listing: Listing): unknown[] {
  return [
    listing.id,
    listing.slug,
    listing.seller.id,
    listing.categoryId,
    listing.status,
    Boolean(listing.isFeatured),
    listing.postedAt ?? null,
    listing.expiresAt ?? null,
    JSON.stringify(listing),
  ];
}

async function readFlagsFile(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(path.join(getDurableAuthDir(), FLAGS_FILE), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function writeFlagsFile(flags: Record<string, string>): Promise<void> {
  const target = path.join(getDurableAuthDir(), FLAGS_FILE);
  await mkdir(path.dirname(target), { recursive: true });
  const tempPath = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(flags, null, 2));
  await rename(tempPath, target);
}

export async function getMarketplaceFlag(key: string): Promise<string | null> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (pool) {
      const result = await pool.query(
        `SELECT value FROM ${FLAGS_TABLE} WHERE key = $1 LIMIT 1`,
        [key],
      );
      return typeof result.rows[0]?.value === "string" ? result.rows[0].value : null;
    }
  }
  const flags = await readFlagsFile();
  return flags[key] ?? null;
}

export async function setMarketplaceFlag(key: string, value: string): Promise<void> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (pool) {
      await pool.query(
        `INSERT INTO ${FLAGS_TABLE} (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value],
      );
      return;
    }
  }
  const flags = await readFlagsFile();
  flags[key] = value;
  await writeFlagsFile(flags);
}

export async function getShowcaseCatalogFlag(): Promise<ShowcaseCatalogFlag | null> {
  const value = await getMarketplaceFlag(SHOWCASE_FLAG_KEY);
  if (value === "published" || value === "hidden" || value === "removed") {
    return value;
  }
  return null;
}

export async function setShowcaseCatalogFlag(value: ShowcaseCatalogFlag): Promise<void> {
  await setMarketplaceFlag(SHOWCASE_FLAG_KEY, value);
}

const DELETED_LISTING_IDS_KEY = "deleted_listing_ids";

export async function getDeletedListingIds(): Promise<Set<string>> {
  const raw = await getMarketplaceFlag(DELETED_LISTING_IDS_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

export async function rememberDeletedListingId(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) return;
  const ids = await getDeletedListingIds();
  if (ids.has(trimmed)) return;
  ids.add(trimmed);
  // Cap growth — keep the most recent ~2k ids.
  const list = Array.from(ids);
  const clipped = list.length > 2000 ? list.slice(list.length - 2000) : list;
  await setMarketplaceFlag(DELETED_LISTING_IDS_KEY, JSON.stringify(clipped));
}

export async function insertListingsIfMissing(listings: Listing[]): Promise<number> {
  const deletedIds = await getDeletedListingIds();
  const eligible = listings.filter((listing) => !deletedIds.has(listing.id));
  let inserted = 0;
  try {
    if (await ensureListingsTable()) {
      const pool = await getOptionalPostgresPool();
      if (!pool) {
        // Fall through to file/memory path below.
      } else {
        for (const listing of eligible) {
          const result = await pool.query(
            `INSERT INTO ${TABLE} (
            id, slug, seller_id, category_id, status, is_featured,
            posted_at, expires_at, updated_at, payload
          ) VALUES (
            $1,$2,$3,$4,$5,$6,
            $7::timestamptz,$8::timestamptz,NOW(),$9::jsonb
          )
          ON CONFLICT (id) DO NOTHING`,
            listingRowValues(listing),
          );
          if ((result as { rowCount?: number }).rowCount) inserted += 1;
        }
        return inserted;
      }
    }
  } catch (error) {
    if (isPostgresQuotaOrUnavailableError(error)) {
      markPostgresUnavailable(error);
    } else {
      throw error;
    }
  }

  const stored = (await readJsonFile()) ?? [];
  const ids = new Set(stored.map((item) => item.id));
  for (const listing of eligible) {
    if (ids.has(listing.id)) continue;
    stored.unshift(listing);
    ids.add(listing.id);
    inserted += 1;
  }
  if (inserted > 0) {
    try {
      await writeJsonFile(stored);
    } catch {
      // Durable write may fail on serverless — inserts still count for this process.
    }
  }
  return inserted;
}

export async function hideShowcaseListings(): Promise<number> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) throw new Error("LISTINGS_STORE_UNAVAILABLE");
    const result = await pool.query(
      `UPDATE ${TABLE}
       SET status = 'draft',
           payload = jsonb_set(payload, '{status}', '"draft"'),
           updated_at = NOW()
       WHERE ${SHOWCASE_WHERE}`,
    );
    return Number((result as { rowCount?: number }).rowCount) || 0;
  }

  const stored = (await readJsonFile()) ?? [];
  let changed = 0;
  const next = stored.map((listing) => {
    if (listing.source !== SHOWCASE_SOURCE && !listing.id.startsWith("showcase-")) {
      return listing;
    }
    changed += 1;
    return { ...listing, status: "draft" as const };
  });
  if (changed > 0) await writeJsonFile(next);
  return changed;
}

export async function deleteShowcaseListings(): Promise<number> {
  if (await ensureListingsTable()) {
    const pool = await getOptionalPostgresPool();
    if (!pool) throw new Error("LISTINGS_STORE_UNAVAILABLE");
    const result = await pool.query(`DELETE FROM ${TABLE} WHERE ${SHOWCASE_WHERE}`);
    return Number((result as { rowCount?: number }).rowCount) || 0;
  }

  const stored = (await readJsonFile()) ?? [];
  const next = stored.filter(
    (listing) => listing.source !== SHOWCASE_SOURCE && !listing.id.startsWith("showcase-"),
  );
  const removed = stored.length - next.length;
  if (removed > 0) await writeJsonFile(next);
  return removed;
}

export { seedListings };
