import type {
  ViewingBooking,
  ViewingBookingStatus,
} from "@/types/domain/viewing-booking";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";
import { listDefaultViewingTimeSlots } from "@/shared/constants/viewing-slots";
import {
  getSellerViewingAvailability,
  isDateAllowedForSeller,
} from "@/services/viewing-bookings/seller-availability-store";

const store = createPayloadCollectionStore<ViewingBooking>({
  table: "viewing_bookings",
  fileName: "sooqna-viewing-bookings.json",
});

const ACTIVE_STATUSES: ViewingBookingStatus[] = [
  "pending",
  "confirmed",
  "modification_proposed",
];

export function getViewingTimeSlots(): string[] {
  return listDefaultViewingTimeSlots();
}

export function getAvailableViewingDates(sellerId?: string): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let offset = 1; offset <= 14; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    dates.push(date.toISOString().slice(0, 10));
  }
  if (!sellerId) return dates.slice(0, 7);
  return dates;
}

export async function getViewingBookingsForListing(
  listingId: string,
): Promise<ViewingBooking[]> {
  const all = await store.listAll();
  return all.filter(
    (item) =>
      item.listingId === listingId && ACTIVE_STATUSES.includes(item.status),
  );
}

export async function getAvailableSlotsForListing(
  listingId: string,
  date: string,
  sellerId?: string,
): Promise<string[]> {
  const booked = await getViewingBookingsForListing(listingId);
  const taken = new Set(
    booked.filter((item) => item.date === date).map((item) => item.time),
  );

  let slots = getViewingTimeSlots();
  if (sellerId) {
    const availability = await getSellerViewingAvailability(sellerId);
    if (!isDateAllowedForSeller(availability, date)) return [];
    if (availability.timeSlots.length > 0) {
      slots = availability.timeSlots;
    }
  }

  return slots.filter((slot) => !taken.has(slot));
}

export async function getViewingBookingsForSeller(
  sellerId: string,
): Promise<ViewingBooking[]> {
  const all = await store.listAll();
  return all.filter((item) => item.sellerId === sellerId);
}

export async function getViewingBookingsForUser(
  userId: string,
): Promise<ViewingBooking[]> {
  const all = await store.listAll();
  return all.filter((item) => item.buyerId === userId);
}

export async function getAllViewingBookings(): Promise<ViewingBooking[]> {
  return store.listAll();
}

export async function getViewingBookingById(
  id: string,
): Promise<ViewingBooking | undefined> {
  const all = await store.listAll();
  return all.find((item) => item.id === id);
}

export async function findViewingBooking(
  buyerId: string,
  listingId: string,
  date: string,
  time: string,
): Promise<ViewingBooking | undefined> {
  const all = await store.listAll();
  return all.find(
    (item) =>
      item.buyerId === buyerId &&
      item.listingId === listingId &&
      item.date === date &&
      item.time === time &&
      ACTIVE_STATUSES.includes(item.status),
  );
}

export async function createViewingBooking(
  input: Omit<ViewingBooking, "id" | "status" | "createdAt">,
): Promise<ViewingBooking> {
  const now = new Date().toISOString();
  const booking: ViewingBooking = {
    ...input,
    id: `view-${Date.now()}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await store.upsert(booking);
  return booking;
}

export async function updateViewingBookingStatus(
  id: string,
  status: ViewingBookingStatus,
): Promise<ViewingBooking | undefined> {
  const current = await getViewingBookingById(id);
  if (!current) return undefined;
  const next: ViewingBooking = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
    ...(status === "confirmed" && current.status === "modification_proposed"
      ? {
          date: current.proposedDate || current.date,
          time: current.proposedTime || current.time,
          proposedDate: undefined,
          proposedTime: undefined,
          proposedNote: undefined,
          proposedBy: undefined,
        }
      : {}),
    ...(status === "cancelled" || status === "completed"
      ? {
          proposedDate: undefined,
          proposedTime: undefined,
          proposedNote: undefined,
          proposedBy: undefined,
        }
      : {}),
  };
  await store.upsert(next);
  return next;
}

export async function proposeViewingModification(input: {
  id: string;
  proposedDate: string;
  proposedTime: string;
  proposedNote?: string;
  proposedBy: "seller" | "buyer" | "admin";
}): Promise<ViewingBooking | undefined> {
  const current = await getViewingBookingById(input.id);
  if (!current) return undefined;
  if (current.status === "cancelled" || current.status === "completed") {
    return undefined;
  }
  const next: ViewingBooking = {
    ...current,
    status: "modification_proposed",
    proposedDate: input.proposedDate,
    proposedTime: input.proposedTime,
    proposedNote: input.proposedNote?.trim() || undefined,
    proposedBy: input.proposedBy,
    updatedAt: new Date().toISOString(),
  };
  await store.upsert(next);
  return next;
}
