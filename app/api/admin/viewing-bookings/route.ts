import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { getAllViewingBookings } from "@/services/viewing-bookings/viewing-booking-store";

export async function GET() {
  const admin = await requireAdminPermission("listings", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }
  const bookings = await getAllViewingBookings();
  return NextResponse.json({ bookings });
}
