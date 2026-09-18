import { randomUUID } from "node:crypto";
import { loadCollection, saveCollection } from "@/services/payments/data-store";

const FOLLOWS_FILE = "seller-follows.json";

export type SellerFollow = {
  id: string;
  followerId: string;
  sellerId: string;
  createdAt: string;
};

async function loadFollows(): Promise<SellerFollow[]> {
  return (await loadCollection<SellerFollow>(FOLLOWS_FILE)) ?? [];
}

export async function isFollowingSeller(
  followerId: string,
  sellerId: string,
): Promise<boolean> {
  const rows = await loadFollows();
  return rows.some(
    (row) => row.followerId === followerId && row.sellerId === sellerId,
  );
}

export async function listFollowedSellerIds(
  followerId: string,
): Promise<string[]> {
  const rows = await loadFollows();
  return rows
    .filter((row) => row.followerId === followerId)
    .map((row) => row.sellerId);
}

/** Follows for one user, newest first. */
export async function listFollowsByFollower(
  followerId: string,
): Promise<SellerFollow[]> {
  const rows = await loadFollows();
  return rows.filter((row) => row.followerId === followerId);
}

export async function listFollowerIds(sellerId: string): Promise<string[]> {
  const rows = await loadFollows();
  return rows
    .filter((row) => row.sellerId === sellerId)
    .map((row) => row.followerId);
}

export async function followSeller(
  followerId: string,
  sellerId: string,
): Promise<SellerFollow> {
  if (followerId === sellerId) {
    throw new Error("CANNOT_FOLLOW_SELF");
  }
  const rows = await loadFollows();
  const existing = rows.find(
    (row) => row.followerId === followerId && row.sellerId === sellerId,
  );
  if (existing) return existing;
  const next: SellerFollow = {
    id: `follow-${randomUUID()}`,
    followerId,
    sellerId,
    createdAt: new Date().toISOString(),
  };
  rows.unshift(next);
  await saveCollection(FOLLOWS_FILE, rows.slice(0, 20_000));
  return next;
}

export async function unfollowSeller(
  followerId: string,
  sellerId: string,
): Promise<boolean> {
  const rows = await loadFollows();
  const next = rows.filter(
    (row) => !(row.followerId === followerId && row.sellerId === sellerId),
  );
  if (next.length === rows.length) return false;
  await saveCollection(FOLLOWS_FILE, next);
  return true;
}
