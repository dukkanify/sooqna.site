import type { ServerFavorite } from "@/types/domain/server-favorite";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

const store = createPayloadCollectionStore<ServerFavorite>({
  table: "marketplace_favorites",
  fileName: "sooqna-favorites.json",
});

export async function getFavoritesForUser(
  userId: string,
): Promise<ServerFavorite[]> {
  const all = await store.listAll();
  return all.filter((item) => item.userId === userId);
}

export async function findFavorite(
  userId: string,
  listingId: string,
): Promise<ServerFavorite | undefined> {
  const all = await store.listAll();
  return all.find(
    (item) => item.userId === userId && item.listingId === listingId,
  );
}

export async function addFavorite(
  input: Omit<ServerFavorite, "id" | "savedAt">,
): Promise<ServerFavorite> {
  const all = await store.listAll();
  const existing = all.find(
    (item) => item.userId === input.userId && item.listingId === input.listingId,
  );
  if (existing) return existing;

  const favorite: ServerFavorite = {
    ...input,
    id: `fav-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  await store.upsert(favorite);
  return favorite;
}

export async function removeFavorite(
  userId: string,
  listingId: string,
): Promise<boolean> {
  const all = await store.listAll();
  const match = all.find(
    (item) => item.userId === userId && item.listingId === listingId,
  );
  if (!match) return false;
  await store.removeById(match.id);
  return true;
}

export async function getAllFavorites(): Promise<ServerFavorite[]> {
  return store.listAll();
}

export async function syncFavoritesForUser(
  userId: string,
  incoming: Omit<ServerFavorite, "id" | "userId" | "savedAt">[],
): Promise<ServerFavorite[]> {
  const all = await store.listAll();
  const existing = all.filter((item) => item.userId === userId);
  const existingIds = new Set(existing.map((item) => item.listingId));

  for (const item of incoming) {
    if (existingIds.has(item.listingId)) continue;
    const favorite: ServerFavorite = {
      ...item,
      id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      savedAt: new Date().toISOString(),
    };
    await store.upsert(favorite);
    existingIds.add(item.listingId);
  }

  return getFavoritesForUser(userId);
}
