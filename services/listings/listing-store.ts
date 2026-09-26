import { cache } from "react";
import {
  marketplaceListings,
  marketplaceUserListings,
} from "@/mock/listings.mock";
import { getAdminSettings } from "@/services/admin/admin-settings-store";
import {
  computeExpiresAt,
  expireStaleListings,
} from "@/services/listings/listing-expiry";
import {
  deleteListingRow,
  deleteMockSeedListings as deletePersistedMockSeedListings,
  loadCatalogWithoutPostgres,
  loadListingById,
  loadListingBySlug,
  loadPersistedListings,
  persistAllListings,
  rememberDeletedListingId,
  seedListings,
  upsertListingRow,
} from "@/services/listings/listing-persistence";
import { repairPoorQualityListings } from "@/services/listings/listing-quality-repair";
import {
  allowMockCatalogSeed,
} from "@/services/listings/mock-catalog-policy";
import { loadAdminListingRecords } from "@/services/listings/listing-queries";
import { bumpListingsCache } from "@/services/listings/listings-cache";
import { isPostgresTemporarilyUnavailable } from "@/services/db/postgres";
import type { Listing } from "@/types";
import { isPurchasableCategory } from "@/shared/listings/purchase-eligibility";
import type {
  AdminListingCreateInput,
  AdminListingPatch,
  AdminListingRecord,
} from "@/types/domain/admin";
import { SHOWCASE_SOURCE } from "@/shared/listings/showcase-listing";
import { sanitizeListingMediaFields } from "@/shared/listings/durable-media";

let cacheRows: Listing[] | null = null;
let inflight: Promise<Listing[]> | null = null;
let expiryApplied = false;

function hydrateCatalogPhones(listings: Listing[]): Listing[] {
  if (!allowMockCatalogSeed()) return listings;
  const phones = new Map(
    seedListings()
      .filter((item) => item.contactPhone)
      .map((item) => [item.id, item.contactPhone as string]),
  );
  return listings.map((listing) => {
    if (listing.contactPhone?.trim()) return listing;
    const phone = phones.get(listing.id);
    return phone ? { ...listing, contactPhone: phone } : listing;
  });
}

/** Merge newly added mock inventory into an older persisted catalog (non-prod only). */
async function mergeMissingSeedListings(stored: Listing[]): Promise<Listing[]> {
  if (!allowMockCatalogSeed()) {
    return stored;
  }
  const seeded = seedListings();
  if (stored.length >= seeded.length) {
    return stored;
  }

  const byId = new Map<string, Listing>();
  for (const listing of stored) {
    byId.set(listing.id, { ...listing });
  }
  for (const listing of seeded) {
    if (!byId.has(listing.id)) {
      byId.set(listing.id, { ...listing });
    }
  }

  const merged = Array.from(byId.values());
  await persistAllListings(merged);
  return merged;
}

function cloneListings(listings: Listing[]) {
  return listings.map((listing) => ({ ...listing }));
}

function setCache(listings: Listing[]) {
  cacheRows = cloneListings(listings);
  return cacheRows;
}

export function clearListingMemoryCache() {
  cacheRows = null;
  inflight = null;
  bumpListingsCache();
}

async function applyListingExpiry(listings: Listing[]): Promise<Listing[]> {
  if (expiryApplied) return listings;
  expiryApplied = true;
  try {
    const settings = await getAdminSettings();
    const changed = expireStaleListings(listings, settings.listingActiveDays);
    if (changed > 0) {
      await persistAllListings(listings).catch(() => undefined);
    }
  } catch {
    // Never block public catalog reads on settings/persistence failures.
  }
  return listings;
}

async function loadListingsUncached(): Promise<Listing[]> {
  // Vercel instances keep module state. Reusing cacheRows hides listings
  // created/approved by another instance and can 404 published pages.
  if (process.env.VERCEL) {
    cacheRows = null;
  }
  if (cacheRows) {
    await applyListingExpiry(cacheRows);
    return cacheRows;
  }

  if (!inflight) {
    inflight = (async () => {
      let stored = await loadPersistedListings().catch(
        () => [] as Listing[],
      );
      if (stored.length === 0) {
        stored = await loadCatalogWithoutPostgres().catch(() => [] as Listing[]);
        if (stored.length === 0 && allowMockCatalogSeed()) {
          stored = seedListings();
          await persistAllListings(stored).catch(() => undefined);
        }
        if (stored.length === 0) return setCache([]);
      }
      const merged = hydrateCatalogPhones(
        await mergeMissingSeedListings(stored).catch(() => stored),
      );
      const { listings: repairedRows, repaired } =
        repairPoorQualityListings(merged);
      if (repaired.length > 0) {
        await Promise.all(
          repaired.map((listing) =>
            upsertListingRow(listing).catch(() => undefined),
          ),
        ).catch(() => undefined);
        try {
          bumpListingsCache();
        } catch {
          // ignore
        }
      }
      await applyListingExpiry(repairedRows);
      return setCache(repairedRows);
    })().finally(() => {
      inflight = null;
    });
  }

  return await inflight;
}

/** Request-deduped catalog read for RSC trees. */
export const getAllListings = cache(async (): Promise<Listing[]> => {
  return loadListingsUncached();
});

/** Sync read for checkout resolvers — uses cache; empty when cold. */
export function getListingSync(idOrSlug: string): Listing | undefined {
  const source =
    cacheRows ??
    (allowMockCatalogSeed()
      ? [...marketplaceListings, ...marketplaceUserListings]
      : []);
  return source.find(
    (listing) => listing.id === idOrSlug || listing.slug === idOrSlug,
  );
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const persisted = await loadListingById(id).catch(() => null);
  if (persisted) return sanitizeListingMediaFields(persisted);
  const listings = await getAllListings();
  const found = listings.find((listing) => listing.id === id || listing.slug === id);
  return found ? sanitizeListingMediaFields(found) : undefined;
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const { syncLiveCatalogMedia } = await import(
    "@/services/listings/live-marketplace-catalog"
  );
  const { listingSlugLookupKeys, normalizeListingSlugParam } = await import(
    "@/shared/listings/listing-slug"
  );
  const withMedia = (listing: Listing | undefined | null) =>
    listing ? syncLiveCatalogMedia([listing])[0] : undefined;

  const keys = listingSlugLookupKeys(slug);
  const normalized = normalizeListingSlugParam(slug);

  // Allow /listings/local-… ids that were used as path segments.
  if (normalized.startsWith("local-") || normalized.startsWith("admin-")) {
    const byId = await getListingById(normalized).catch(() => undefined);
    if (byId) return withMedia(byId);
  }

  // Fast path when Neon quota is exceeded — avoid write-heavy ensure* on every view.
  if (isPostgresTemporarilyUnavailable()) {
    const memory = await loadCatalogWithoutPostgres().catch(() => [] as Listing[]);
    const hit = memory.find((listing) => keys.includes(listing.slug));
    if (hit) return withMedia(hit);
  }

  try {
    const { ensureShowcaseCatalogPublished } = await import(
      "@/services/listings/showcase-catalog.service"
    );
    const { ensureLiveMarketplaceCatalogPublished } = await import(
      "@/services/listings/live-marketplace-catalog.service"
    );
    await Promise.all([
      ensureShowcaseCatalogPublished().catch(() => undefined),
      ensureLiveMarketplaceCatalogPublished().catch(() => 0),
    ]);
  } catch {
    // Catalog ensure is best-effort for public reads.
  }

  for (const key of keys) {
    const persisted = await loadListingBySlug(key).catch(() => null);
    if (persisted) return withMedia(persisted);
  }

  const listings = await getAllListings().catch(() => [] as Listing[]);
  const fromCatalog =
    listings.find((listing) => keys.includes(listing.slug)) ??
    (await loadCatalogWithoutPostgres().catch(() => [] as Listing[])).find(
      (listing) => keys.includes(listing.slug),
    );
  return withMedia(fromCatalog);
}

export async function upsertListing(listing: Listing): Promise<Listing> {
  const listings = await loadListingsUncached();
  const settings = await getAdminSettings();
  const postedAt = listing.postedAt ?? new Date().toISOString();
  const index = listings.findIndex((item) => item.id === listing.id);
  const previous = index >= 0 ? listings[index] : undefined;
  const history = [...(listing.statusHistory ?? previous?.statusHistory ?? [])];
  if (!previous) {
    history.push({
      at: postedAt,
      to: listing.status,
      byUserId: listing.seller.id,
      note: "created",
    });
  } else if (previous.status !== listing.status) {
    history.push({
      at: new Date().toISOString(),
      from: previous.status,
      to: listing.status,
      byUserId: listing.seller.id,
    });
  }

  // Keep slug unique across rows — colliding slugs made seller cards and detail
  // pages resolve to different payloads for the "same" URL.
  let slug = (listing.slug || slugifyTitle(listing.title)).trim();
  const slugOwner = listings.find(
    (item) => item.slug === slug && item.id !== listing.id,
  );
  if (slugOwner) {
    const suffix = listing.id.replace(/\W+/g, "").slice(-8) || String(Date.now()).slice(-6);
    slug = `${slugifyTitle(listing.title) || "listing"}-${suffix}`;
  }

  const next: Listing = sanitizeListingMediaFields({
    ...listing,
    slug,
    postedAt,
    expiresAt:
      listing.expiresAt ??
      computeExpiresAt(postedAt, settings.listingActiveDays),
    statusHistory: history,
    rejectionReason:
      listing.status === "rejected"
        ? listing.rejectionReason ?? previous?.rejectionReason
        : listing.status === "active"
          ? undefined
          : listing.rejectionReason ?? previous?.rejectionReason,
  });
  if (index >= 0) listings[index] = next;
  else listings.unshift(next);
  await upsertListingRow(next);
  cacheRows = null;
  bumpListingsCache();
  return { ...next };
}

function slugifyTitle(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return base || `listing-${Date.now()}`;
}

export async function createListingFromAdmin(
  input: AdminListingCreateInput,
): Promise<Listing> {
  const now = Date.now();
  const slugBase = slugifyTitle(input.title);
  const slug = `${slugBase}-${String(now).slice(-5)}`;
  const sellerName = input.sellerName?.trim() || "إدارة سوقنا";
  const city = input.city.trim();
  const emirate = input.emirate?.trim() || city;
  const settings = await getAdminSettings();
  const postedAt = new Date().toISOString();

  const listing: Listing = {
    id: `admin-${now}`,
    slug,
    title: input.title.trim(),
    description:
      input.description?.trim() ||
      `إعلان مضاف من لوحة التحكم: ${input.title.trim()}`,
    categoryId: input.categoryId,
    city,
    emirate,
    area: input.area?.trim() || undefined,
    country: "الإمارات العربية المتحدة",
    price: input.price,
    currency: "AED",
    condition: input.condition ?? "used",
    status: input.status ?? "active",
    isFeatured: Boolean(input.isFeatured),
    views: 0,
    seller: {
      id: "seller-admin-ops",
      name: sellerName,
      sellerType: "individual",
    },
    verifiedSeller: false,
    escrowAvailable: isPurchasableCategory(input.categoryId),
    postedAt,
    expiresAt: computeExpiresAt(postedAt, settings.listingActiveDays),
    contactMethod: "both",
    contactPhone: input.contactPhone?.trim() || undefined,
    deliveryOption: "both",
    imageTone: "gold",
    categorySpecs: input.categorySpecs,
    features: input.features?.length ? input.features : undefined,
    negotiable: input.negotiable,
    ...(input.imageUrl?.trim()
      ? { imageUrl: input.imageUrl.trim() }
      : {}),
    ...(input.images?.length
      ? { images: input.images, imageUrl: input.images[0] ?? input.imageUrl }
      : {}),
  };

  return upsertListing(listing);
}

export async function patchListingRecord(
  id: string,
  patch: AdminListingPatch,
): Promise<Listing | undefined> {
  const listings = await loadListingsUncached();
  const index = listings.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  const previous = listings[index];
  const history = [...(previous.statusHistory ?? [])];
  if (patch.status && patch.status !== previous.status) {
    history.push({
      at: new Date().toISOString(),
      from: previous.status,
      to: patch.status,
      note: patch.rejectReason,
    });
  }

  const nextImages =
    patch.images !== undefined
      ? patch.images
      : patch.imageUrl !== undefined
        ? [patch.imageUrl, ...(previous.images ?? []).filter((url) => url !== patch.imageUrl)]
        : previous.images;

  listings[index] = {
    ...previous,
    ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description.trim() }
      : {}),
    ...(typeof patch.price === "number" && Number.isFinite(patch.price)
      ? { price: patch.price }
      : {}),
    ...(patch.city !== undefined ? { city: patch.city.trim() } : {}),
    ...(patch.emirate !== undefined
      ? { emirate: patch.emirate.trim() || undefined }
      : {}),
    ...(patch.condition !== undefined ? { condition: patch.condition } : {}),
    ...(patch.contactPhone !== undefined
      ? { contactPhone: patch.contactPhone.trim() || undefined }
      : {}),
    ...(patch.imageUrl !== undefined
      ? { imageUrl: patch.imageUrl.trim() || undefined }
      : {}),
    ...(patch.images !== undefined || patch.imageUrl !== undefined
      ? {
          images: nextImages?.filter(Boolean),
          imageUrl:
            patch.imageUrl !== undefined
              ? patch.imageUrl.trim() ||
                nextImages?.filter(Boolean)?.[0] ||
                undefined
              : nextImages?.filter(Boolean)?.[0] || previous.imageUrl,
        }
      : {}),
    ...(patch.sellerName !== undefined
      ? {
          seller: {
            ...previous.seller,
            name: patch.sellerName.trim() || previous.seller.name,
          },
        }
      : {}),
    ...(patch.categorySpecs !== undefined
      ? { categorySpecs: patch.categorySpecs }
      : {}),
    ...(patch.features !== undefined
      ? { features: patch.features.length ? patch.features : undefined }
      : {}),
    ...(typeof patch.negotiable === "boolean"
      ? { negotiable: patch.negotiable }
      : {}),
    ...(patch.videoUrl !== undefined
      ? { videoUrl: patch.videoUrl.trim() || undefined }
      : {}),
    ...(patch.status ? { status: patch.status } : {}),
    ...(typeof patch.isFeatured === "boolean" ? { isFeatured: patch.isFeatured } : {}),
    ...(patch.status === "rejected"
      ? {
          rejectionReason:
            patch.rejectReason?.trim() || previous.rejectionReason,
        }
      : {}),
    ...(patch.status === "active"
      ? {
          rejectionReason: undefined,
          postedAt: previous.postedAt ?? new Date().toISOString(),
        }
      : {}),
    statusHistory: history,
  };
  listings[index] = sanitizeListingMediaFields(listings[index]);
  await upsertListingRow(listings[index]);
  cacheRows = null;
  bumpListingsCache();
  return { ...listings[index] };
}

export async function setListingFeatured(
  id: string,
  featured: boolean,
  days?: number,
): Promise<Listing | undefined> {
  const listings = await loadListingsUncached();
  const index = listings.findIndex((item) => item.id === id);
  if (index < 0) return undefined;

  const settings = days == null ? await getAdminSettings() : null;
  const featureDays = days ?? settings!.featuredListingDays;
  const featuredUntil = featured
    ? computeExpiresAt(new Date().toISOString(), featureDays)
    : undefined;

  const current = listings[index];
  // Featured payment completed: leave draft and enter moderation queue.
  const nextStatus =
    featured && current.status === "draft" ? "pending_review" : current.status;

  listings[index] = {
    ...current,
    status: nextStatus,
    isFeatured: featured,
    isPremium: featured ? true : current.isPremium,
    featuredUntil,
  };
  await upsertListingRow(listings[index]);
  cacheRows = null;
  bumpListingsCache();
  return { ...listings[index] };
}

export async function deleteListingById(
  id: string,
  sellerId?: string,
): Promise<boolean> {
  const listings = await loadListingsUncached();
  const index = listings.findIndex((item) => item.id === id);
  if (index < 0) {
    // Tombstone + best-effort row delete so showcase cannot resurrect it.
    await rememberDeletedListingId(id);
    const removed = await deleteListingRow(id).catch(() => false);
    cacheRows = null;
    inflight = null;
    bumpListingsCache();
    return Boolean(removed);
  }
  if (sellerId && listings[index].seller.id !== sellerId) {
    return false;
  }
  listings.splice(index, 1);
  await deleteListingRow(id);
  await rememberDeletedListingId(id);
  cacheRows = null;
  inflight = null;
  bumpListingsCache();
  return true;
}

export async function purgeMockSeedListings(): Promise<{
  removed: number;
  remainingSeed: number;
  removedIds: string[];
}> {
  const result = await deletePersistedMockSeedListings();
  cacheRows = null;
  inflight = null;
  bumpListingsCache();
  return {
    removed: result.removedIds.length,
    remainingSeed: result.remainingSeed,
    removedIds: result.removedIds,
  };
}

export async function renewListing(id: string): Promise<Listing | undefined> {
  const listings = await loadListingsUncached();
  const index = listings.findIndex((item) => item.id === id);
  if (index < 0) return undefined;

  const settings = await getAdminSettings();
  const postedAt = new Date().toISOString();
  listings[index] = {
    ...listings[index],
    postedAt,
    expiresAt: computeExpiresAt(postedAt, settings.listingActiveDays),
    status: "pending_review",
  };
  await upsertListingRow(listings[index]);
  cacheRows = null;
  bumpListingsCache();
  return { ...listings[index] };
}

/** Update seller.rating / reviewCount on all listings for a seller. */
export async function updateSellerListingRating(
  sellerId: string,
  average: number,
  reviewCount: number,
): Promise<void> {
  const listings = await loadListingsUncached();
  let changed = false;
  for (let i = 0; i < listings.length; i += 1) {
    if (listings[i].seller.id !== sellerId) continue;
    listings[i] = {
      ...listings[i],
      seller: {
        ...listings[i].seller,
        rating: average,
        reviewCount,
      },
    };
    changed = true;
  }
  if (!changed) return;
  for (const listing of listings) {
    if (listing.seller.id !== sellerId) continue;
    await upsertListingRow(listing);
  }
  cacheRows = null;
  bumpListingsCache();
}

export function toAdminListingRecord(listing: Listing): AdminListingRecord {
  const media = sanitizeListingMediaFields(listing);
  return {
    id: media.id,
    slug: media.slug,
    title: media.title,
    description: media.description,
    sellerName: media.seller.name,
    sellerId: media.seller.id,
    categoryId: media.categoryId,
    price: media.price,
    currency: media.currency,
    status: media.status,
    isFeatured: media.isFeatured,
    postedAt: media.postedAt ?? "",
    city: media.city,
    emirate: media.emirate,
    condition: media.condition,
    contactPhone: media.contactPhone,
    imageUrl: media.imageUrl ?? media.images?.[0],
    images: media.images?.length
      ? media.images
      : media.imageUrl
        ? [media.imageUrl]
        : undefined,
    categorySpecs: media.categorySpecs,
    features: media.features,
    negotiable: media.negotiable,
    isDemo: media.isDemo === true || media.source === SHOWCASE_SOURCE,
    source: media.source,
  };
}

export async function getAdminListingRecords(): Promise<AdminListingRecord[]> {
  return loadAdminListingRecords();
}

export async function getListingsModerationSummary() {
  const listings = await getAllListings();
  return {
    totalListings: listings.length,
    pendingListings: listings.filter((item) => item.status === "pending_review").length,
    activeListings: listings.filter((item) => item.status === "active").length,
    featuredListings: listings.filter((item) => item.isFeatured).length,
  };
}
