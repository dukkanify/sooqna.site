import type { AppLocale } from "@/shared/i18n/locale";

const PRICE_OPTIONS_AR = [
  { label: "أي سعر", value: "" },
  { label: "أقل من 50K", value: "0-50000" },
  { label: "50K – 200K", value: "50000-200000" },
  { label: "أكثر من 200K", value: "200000+" },
] as const;

const PRICE_OPTIONS_EN = [
  { label: "Any price", value: "" },
  { label: "Under 50K", value: "0-50000" },
  { label: "50K – 200K", value: "50000-200000" },
  { label: "Over 200K", value: "200000+" },
] as const;

const LABELS_AR = {
  category: "التصنيف",
  categoryAll: "كل التصنيفات",
  city: "الإمارة",
  cityAll: "جميع الإمارات",
  price: "السعر",
  query: "ماذا تبحث عنه؟",
  queryPlaceholder: "ابحث عن أي شيء...",
  submit: "بحث",
} as const;

const LABELS_EN = {
  category: "Category",
  categoryAll: "All categories",
  city: "Emirate",
  cityAll: "All Emirates",
  price: "Price",
  query: "What are you looking for?",
  queryPlaceholder: "Search for anything...",
  submit: "Search",
} as const;

/** @deprecated Prefer getHomeSearchLabels(locale) — kept for Arabic-default callers. */
export const HOME_SEARCH_LABELS = LABELS_AR;

/** @deprecated Prefer getHomeSearchPriceOptions(locale). */
export const HOME_SEARCH_PRICE_OPTIONS = PRICE_OPTIONS_AR;

export function getHomeSearchLabels(locale: AppLocale = "ar") {
  return locale === "en" ? LABELS_EN : LABELS_AR;
}

export function getHomeSearchPriceOptions(locale: AppLocale = "ar") {
  return locale === "en" ? PRICE_OPTIONS_EN : PRICE_OPTIONS_AR;
}
