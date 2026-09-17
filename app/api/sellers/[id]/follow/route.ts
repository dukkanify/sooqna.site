import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  followSeller,
  isFollowingSeller,
  unfollowSeller,
} from "@/services/follows/follow-store";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  const { id: sellerId } = await params;
  const following = await isFollowingSeller(user.id, sellerId);
  return NextResponse.json({ following });
}

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  const { id: sellerId } = await params;
  if (sellerId === user.id) {
    return NextResponse.json({ error: "CANNOT_FOLLOW_SELF" }, { status: 400 });
  }
  try {
    await followSeller(user.id, sellerId);
    return NextResponse.json({ following: true });
  } catch {
    return NextResponse.json({ error: "FOLLOW_FAILED" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  const { id: sellerId } = await params;
  await unfollowSeller(user.id, sellerId);
  return NextResponse.json({ following: false });
}
