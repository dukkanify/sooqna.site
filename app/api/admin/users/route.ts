import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { getAllUsers, toAdminUserRecord } from "@/services/auth/user-store";
import { countListingsBySeller } from "@/services/listings/listing-queries";

export async function GET() {
  const admin = await requireAdminPermission("users");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const [users, listingCounts] = await Promise.all([
    getAllUsers(),
    countListingsBySeller(),
  ]);

  return NextResponse.json({
    users: users.map((user) =>
      toAdminUserRecord(user, listingCounts.get(user.id) ?? 0),
    ),
  });
}
