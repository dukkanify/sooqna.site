import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { listDefaultViewingTimeSlots } from "@/shared/constants/viewing-slots";
import {
  getSellerViewingAvailability,
  saveSellerViewingAvailability,
} from "@/services/viewing-bookings/seller-availability-store";

const putSchema = z.object({
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(24),
});

/** Advertiser viewing availability (profile-managed). */
export async function GET() {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  const availability = await getSellerViewingAvailability(user.id);
  return NextResponse.json({
    availability,
    defaultTimeSlots: listDefaultViewingTimeSlots(),
  });
}

export async function PUT(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const availability = await saveSellerViewingAvailability({
    sellerId: user.id,
    weekdays: parsed.data.weekdays,
    timeSlots: parsed.data.timeSlots,
  });
  return NextResponse.json({ availability });
}
