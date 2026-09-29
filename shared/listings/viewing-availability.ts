/** Pure helpers for seller viewing-availability rules (no store I/O). */

export function isDateAllowedForWeekdays(
  weekdays: number[],
  dateIso: string,
): boolean {
  const date = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const weekday = date.getDay();
  const days = weekdays.length > 0 ? weekdays : [0, 1, 2, 3, 4, 5, 6];
  return days.includes(weekday);
}

export const VIEWING_STATUS_LABELS = {
  pending: "بانتظار الرد",
  confirmed: "مؤكد",
  modification_proposed: "تعديل مقترح",
  cancelled: "ملغي",
  completed: "مكتمل",
} as const;
