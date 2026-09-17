import { randomUUID } from "node:crypto";
import { loadCollection, saveCollection } from "@/services/payments/data-store";
import { dispatchPlatformNotification } from "@/services/notifications/platform-notify";
import type { Listing } from "@/types";

const SAVED_SEARCHES_FILE = "user-saved-searches.json";

export type StoredSavedSearch = {
  id: string;
  userId: string;
  label: string;
  url: string;
  query?: string;
  categoryId?: string;
  city?: string;
  createdAt: string;
};

async function loadAll(): Promise<StoredSavedSearch[]> {
  return (await loadCollection<StoredSavedSearch>(SAVED_SEARCHES_FILE)) ?? [];
}

export async function listSavedSearchesForUser(
  userId: string,
): Promise<StoredSavedSearch[]> {
  return (await loadAll()).filter((row) => row.userId === userId);
}

export async function upsertSavedSearch(input: {
  userId: string;
  label: string;
  url: string;
  query?: string;
  categoryId?: string;
  city?: string;
}): Promise<StoredSavedSearch> {
  const rows = await loadAll();
  const existing = rows.find(
    (row) => row.userId === input.userId && row.url === input.url,
  );
  if (existing) {
    existing.label = input.label;
    existing.query = input.query;
    existing.categoryId = input.categoryId;
    existing.city = input.city;
    await saveCollection(SAVED_SEARCHES_FILE, rows);
    return existing;
  }
  const next: StoredSavedSearch = {
    id: `ss-${randomUUID()}`,
    userId: input.userId,
    label: input.label,
    url: input.url,
    query: input.query,
    categoryId: input.categoryId,
    city: input.city,
    createdAt: new Date().toISOString(),
  };
  rows.unshift(next);
  await saveCollection(SAVED_SEARCHES_FILE, rows.slice(0, 10_000));
  return next;
}

export async function removeSavedSearchForUser(
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await loadAll();
  const next = rows.filter((row) => !(row.userId === userId && row.id === id));
  if (next.length === rows.length) return false;
  await saveCollection(SAVED_SEARCHES_FILE, next);
  return true;
}

function listingMatchesSearch(listing: Listing, search: StoredSavedSearch): boolean {
  if (search.categoryId && listing.categoryId !== search.categoryId) {
    return false;
  }
  if (search.city) {
    const city = search.city.trim();
    if (
      listing.city !== city &&
      listing.emirate !== city &&
      !(listing.area && listing.area.includes(city))
    ) {
      return false;
    }
  }
  const q = search.query?.trim().toLowerCase();
  if (!q) return Boolean(search.categoryId || search.city);
  const hay = [
    listing.title,
    listing.titleEnglish,
    listing.description,
    listing.categorySpecs?.brand,
    listing.categorySpecs?.model,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/** Notify users whose saved searches match a newly approved listing. */
export async function notifySavedSearchMatches(listing: Listing): Promise<void> {
  if (listing.status !== "active" && listing.status !== "reserved") return;
  const rows = await loadAll();
  const matchedUserIds = new Set<string>();
  for (const search of rows) {
    if (!listingMatchesSearch(listing, search)) continue;
    if (matchedUserIds.has(search.userId)) continue;
    matchedUserIds.add(search.userId);
    await dispatchPlatformNotification({
      userId: search.userId,
      type: "saved_search_match",
      title: "إعلان مطابق لبحثك المحفوظ",
      titleEn: "New listing matches your saved search",
      body: `ظهر إعلان جديد يطابق «${search.label}»: ${listing.title}`,
      bodyEn: `A new listing matches “${search.label}”: ${listing.titleEnglish || listing.title}`,
      href: `/listings/${listing.slug}`,
      dedupeKey: `saved-search:${search.userId}:${listing.id}`,
    });
  }
}
