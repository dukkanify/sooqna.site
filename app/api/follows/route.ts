import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { findUserById } from "@/services/auth/user-store";
import { listFollowsByFollower } from "@/services/follows/follow-store";
import {
  getSellerListings,
  getSellerProfile,
} from "@/services/sellers/seller-profile.service";

export type FollowedSellerDto = {
  id: string;
  name: string;
  nameEnglish?: string;
  avatarUrl?: string;
  isVerified: boolean;
  listingCount: number;
  followedAt: string;
  responseTime?: string;
};

export async function GET() {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const follows = await listFollowsByFollower(user.id);
  const sellers: FollowedSellerDto[] = [];

  for (const follow of follows) {
    const listings = await getSellerListings(follow.sellerId);
    const profile = getSellerProfile(follow.sellerId, listings);
    const account = profile ? null : await findUserById(follow.sellerId);

    const name =
      profile?.name?.trim() ||
      account?.fullName?.trim() ||
      "بائع";
    const nameEnglish =
      profile?.nameEnglish?.trim() ||
      account?.fullName?.trim() ||
      undefined;

    sellers.push({
      id: follow.sellerId,
      name,
      nameEnglish: nameEnglish && nameEnglish !== name ? nameEnglish : undefined,
      avatarUrl: profile?.avatarUrl,
      isVerified: Boolean(profile?.isVerified ?? account?.isVerified),
      listingCount: listings.length,
      followedAt: follow.createdAt,
      responseTime: profile?.responseTime,
    });
  }

  return NextResponse.json({ sellers });
}
