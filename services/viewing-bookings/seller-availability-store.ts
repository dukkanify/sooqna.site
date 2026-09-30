import type { SellerViewingAvailability } from "@/types/domain/viewing-booking";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";
import { listDefaultViewingTimeSlots } from "@/shared/constants/viewing-slots";
import { isDateAllowedForWeekdays } from "@/shared/listings/viewing-availability";

const store = createPayloadCollectionStore<SellerViewingAvailability>({
  table: "seller_viewing_availability",
  fileName: "sooqna-seller-viewing-availability.json",
});

const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export async function getSellerViewingAvailability(
  sellerId: string,
): Promise<SellerViewingAvailability> {
  const all = await store.listAll();
  const found = all.find((row) => row.sellerId === sellerId || row.id === sellerId);
  if (found) return found;
  return {
    id: sellerId,
    sellerId,
    weekdays: DEFAULT_WEEKDAYS,
    timeSlots: listDefaultViewingTimeSlots(),
    updatedAt: new Date().toISOString(),
  };
}

export async function saveSellerViewingAvailability(input: {
  sellerId: string;
  weekdays: number[];
  timeSlots: string[];
}): Promise<SellerViewingAvailability> {
  const allowedSlots = new Set(listDefaultViewingTimeSlots());
  const weekdays = [...new Set(input.weekdays)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  const timeSlots = [...new Set(input.timeSlots)]
    .filter((slot) => allowedSlots.has(slot))
    .sort();

  const record: SellerViewingAvailability = {
    id: input.sellerId,
    sellerId: input.sellerId,
    weekdays: weekdays.length > 0 ? weekdays : DEFAULT_WEEKDAYS,
    timeSlots: timeSlots.length > 0 ? timeSlots : listDefaultViewingTimeSlots(),
    updatedAt: new Date().toISOString(),
  };
  await store.upsert(record);
  return record;
}

export function isDateAllowedForSeller(
  availability: SellerViewingAvailability,
  dateIso: string,
): boolean {
  return isDateAllowedForWeekdays(availability.weekdays, dateIso);
}
