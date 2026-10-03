import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { NextResponse } from "next/server";
import { getAllAddresses } from "@/services/addresses/address-store";
import { resolveDisplayMaps } from "@/services/display/resolve-display-labels";

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }

  const addresses = await getAllAddresses();
  const { users } = await resolveDisplayMaps({
    userIds: addresses.map((item) => item.userId),
  });

  return NextResponse.json({
    summary: {
      total: addresses.length,
      users: new Set(addresses.map((item) => item.userId)).size,
    },
    addresses: addresses.map((item) => {
      const user = users.get(item.userId);
      return {
        ...item,
        userName: user?.name ?? "مستخدم",
        userHref: user?.href,
        userEmail: user?.email,
      };
    }),
  });
}
