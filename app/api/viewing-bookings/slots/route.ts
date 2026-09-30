import { NextResponse } from "next/server";
import {
  getAvailableSlotsForListing,
  getAvailableViewingDates,
  getViewingTimeSlots,
} from "@/services/viewing-bookings/viewing-booking-store";
import {
  getSellerViewingAvailability,
  isDateAllowedForSeller,
} from "@/services/viewing-bookings/seller-availability-store";
import { resolveServerListing } from "@/services/listings/listing-action-resolver";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");
  const date = url.searchParams.get("date");
  const sellerIdParam = url.searchParams.get("sellerId");

  if (!listingId) {
    return NextResponse.json({
      dates: getAvailableViewingDates(),
      timeSlots: getViewingTimeSlots(),
    });
  }

  const listing = resolveServerListing(listingId);
  const sellerId = sellerIdParam || listing?.seller.id;

  if (!date) {
    let dates = getAvailableViewingDates();
    if (sellerId) {
      const availability = await getSellerViewingAvailability(sellerId);
      dates = dates.filter((day) => isDateAllowedForSeller(availability, day));
    }
    return NextResponse.json({ dates });
  }

  const slots = await getAvailableSlotsForListing(
    listingId,
    date,
    sellerId || undefined,
  );
  return NextResponse.json({ slots });
}
