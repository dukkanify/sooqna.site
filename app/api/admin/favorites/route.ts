import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { NextResponse } from "next/server";
import { getAllFavorites } from "@/services/favorites/favorite-store";
import { resolveDisplayMaps } from "@/services/display/resolve-display-labels";
import { humanDisplayLabel } from "@/shared/display/technical-id";

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }

  const favorites = await getAllFavorites();
  const byListing = new Map<string, number>();
  for (const favorite of favorites) {
    byListing.set(
      favorite.listingId,
      (byListing.get(favorite.listingId) ?? 0) + 1,
    );
  }

  const { listings, users } = await resolveDisplayMaps({
    listingIds: favorites.map((item) => item.listingId),
    userIds: favorites.map((item) => item.userId),
  });

  const topListings = [...byListing.entries()]
    .map(([listingId, count]) => {
      const listing = listings.get(listingId);
      return {
        listingId,
        count,
        title: listing?.title ?? humanDisplayLabel(undefined, "إعلان"),
        href: listing?.href,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json({
    summary: {
      total: favorites.length,
      uniqueListings: byListing.size,
      uniqueUsers: new Set(favorites.map((item) => item.userId)).size,
    },
    topListings,
    favorites: favorites.slice(0, 100).map((item) => {
      const listing = listings.get(item.listingId);
      const user = users.get(item.userId);
      return {
        ...item,
        title: listing?.title ?? humanDisplayLabel(item.title, "إعلان"),
        listingTitle: listing?.title ?? humanDisplayLabel(item.title, "إعلان"),
        listingHref: listing?.href,
        userName: user?.name ?? "مستخدم",
        userHref: user?.href,
        userEmail: user?.email,
      };
    }),
  });
}
