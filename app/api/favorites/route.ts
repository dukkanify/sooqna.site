import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  addFavorite,
  getFavoritesForUser,
  syncFavoritesForUser,
} from "@/services/favorites/favorite-store";
import { resolveDisplayMaps } from "@/services/display/resolve-display-labels";
import { humanDisplayLabel } from "@/shared/display/technical-id";

const favoriteSchema = z.object({
  listingId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  price: z.number().min(0),
  imageUrl: z.string().optional(),
});

const syncSchema = z.object({
  favorites: z.array(
    z.object({
      listingId: z.string().min(1),
      slug: z.string().min(1),
      title: z.string().min(1),
      price: z.number().min(0),
      imageUrl: z.string().optional(),
    }),
  ),
});

export async function GET() {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const favorites = await getFavoritesForUser(user.id);
  const { listings } = await resolveDisplayMaps({
    listingIds: favorites.map((item) => item.listingId),
  });
  return NextResponse.json({
    favorites: favorites.map((item) => {
      const listing = listings.get(item.listingId);
      return {
        ...item,
        title: listing?.title ?? humanDisplayLabel(item.title, "إعلان"),
        slug: listing?.slug || item.slug,
      };
    }),
  });
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const body = await request.json();
  if (body.sync) {
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    const favorites = await syncFavoritesForUser(user.id, parsed.data.favorites);
    return NextResponse.json({ favorites });
  }

  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const favorite = await addFavorite({
    ...parsed.data,
    userId: user.id,
  });
  return NextResponse.json({ favorite });
}
