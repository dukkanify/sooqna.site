import type { City } from "@/types";

export const countries = [
  {
    id: "ae",
    name: "الإمارات العربية المتحدة",
  },
];

export const cities: City[] = [
  { id: "dubai", name: "دبي" },
  { id: "abu-dhabi", name: "أبوظبي" },
  { id: "sharjah", name: "الشارقة" },
  { id: "ajman", name: "عجمان" },
  { id: "umm-al-quwain", name: "أم القيوين" },
  { id: "ras-al-khaimah", name: "رأس الخيمة" },
  { id: "fujairah", name: "الفجيرة" },
];

/** Header/search All-Emirates option. Legacy stored value "كل الإمارات" is still accepted. */
export const ALL_EMIRATES_NAME = "جميع الإمارات";
export const ALL_EMIRATES_LEGACY_NAME = "كل الإمارات";

export function isAllEmiratesSelection(value: string | null | undefined): boolean {
  return value === ALL_EMIRATES_NAME || value === ALL_EMIRATES_LEGACY_NAME || !value;
}
