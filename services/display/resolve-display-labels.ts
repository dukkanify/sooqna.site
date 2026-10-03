import { listPersistedUsers } from "@/services/auth/user-persistence";
import { getAllListings } from "@/services/listings/listing-store";
import {
  adminUserSearchHref,
  humanDisplayLabel,
} from "@/shared/display/technical-id";
import { getListingPath } from "@/shared/listings/listing-url";
import { sellerDisplayNameFromProfile } from "@/shared/listings/seller-display-name";
import { getSellerHref } from "@/shared/listings/seller-href";

export type DisplayPerson = {
  email?: string;
  href: string;
  id: string;
  name: string;
  publicHref: string;
};

export type DisplayListing = {
  href: string;
  id: string;
  slug: string;
  title: string;
};

function uniqueIds(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const id = String(value ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export async function resolveDisplayMaps(input: {
  listingIds?: Array<string | null | undefined>;
  userIds?: Array<string | null | undefined>;
}): Promise<{
  listings: Map<string, DisplayListing>;
  users: Map<string, DisplayPerson>;
}> {
  const userIds = uniqueIds(input.userIds ?? []);
  const listingIds = uniqueIds(input.listingIds ?? []);
  const users = new Map<string, DisplayPerson>();
  const listings = new Map<string, DisplayListing>();

  if (userIds.length > 0) {
    const allUsers = await listPersistedUsers().catch(() => []);
    const byId = new Map(allUsers.map((user) => [user.id, user]));
    for (const id of userIds) {
      const user = byId.get(id);
      const name = humanDisplayLabel(
        user ? sellerDisplayNameFromProfile(user) : "",
        humanDisplayLabel(user?.email, "مستخدم"),
      );
      const email = user?.email?.trim() || undefined;
      users.set(id, {
        id,
        name,
        email,
        href: adminUserSearchHref(email || name),
        publicHref: getSellerHref(id),
      });
    }
  }

  if (listingIds.length > 0) {
    const catalog = await getAllListings().catch(() => []);
    const byKey = new Map<string, (typeof catalog)[number]>();
    for (const listing of catalog) {
      byKey.set(listing.id, listing);
      if (listing.slug) byKey.set(listing.slug, listing);
    }
    for (const id of listingIds) {
      const listing = byKey.get(id);
      if (!listing) continue;
      listings.set(id, {
        id: listing.id,
        slug: listing.slug?.trim() || "",
        title: humanDisplayLabel(listing.title, "إعلان"),
        href: getListingPath(listing),
      });
    }
  }

  return { listings, users };
}
