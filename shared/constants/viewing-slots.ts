/** Default property-viewing time slots (24h HH:mm). */
export const DEFAULT_VIEWING_TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export function listDefaultViewingTimeSlots(): string[] {
  return [...DEFAULT_VIEWING_TIME_SLOTS];
}
