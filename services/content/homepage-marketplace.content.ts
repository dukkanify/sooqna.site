import { BRAND } from "@/shared/constants/brand";
import type { AppLocale } from "@/shared/i18n/locale";
import { getEmirateImageUrl, heroBackgroundUrl } from "@/shared/constants/image-fallbacks";
import type { HeroPillKey } from "@/services/search/search-popularity";

export type MarketEscrowStep = {
  description: string;
  icon: string;
  title: string;
};

export type MarketQuickSearch = {
  href: string;
  key: HeroPillKey;
  label: string;
};

export async function getMarketHeroBackground(): Promise<string> {
  return heroBackgroundUrl;
}

const QUICK_SEARCHES_AR: MarketQuickSearch[] = [
  { key: "mercedes", href: "/search?q=مرسيدس", label: "مرسيدس" },
  { key: "patrol", href: "/search?q=باترول", label: "باترول" },
  { key: "yas-island", href: "/search?q=جزيرة+ياس", label: "جزيرة ياس" },
  { key: "abu-dhabi-corniche", href: "/search?q=كورنيش+أبوظبي", label: "كورنيش أبوظبي" },
  { key: "apartment", href: "/search?q=شقة", label: "شقة" },
  { key: "villa", href: "/search?q=فيلا", label: "فيلا" },
  { key: "iphone", href: "/search?q=آيفون", label: "آيفون" },
  { key: "office", href: "/search?q=مكتب", label: "مكتب" },
  { key: "macbook", href: "/search?q=ماك+بوك", label: "ماك بوك" },
  { key: "land-cruiser", href: "/search?q=لاند+كروزر", label: "لاند كروزر" },
];

const QUICK_SEARCHES_EN: MarketQuickSearch[] = [
  { key: "mercedes", href: "/search?q=Mercedes", label: "Mercedes" },
  { key: "patrol", href: "/search?q=Patrol", label: "Patrol" },
  { key: "yas-island", href: "/search?q=Yas+Island", label: "Yas Island" },
  {
    key: "abu-dhabi-corniche",
    href: "/search?q=Abu+Dhabi+Corniche",
    label: "Abu Dhabi Corniche",
  },
  { key: "apartment", href: "/search?q=Apartment", label: "Apartment" },
  { key: "villa", href: "/search?q=Villa", label: "Villa" },
  { key: "iphone", href: "/search?q=iPhone", label: "iPhone" },
  { key: "office", href: "/search?q=Office", label: "Office" },
  { key: "macbook", href: "/search?q=MacBook", label: "MacBook" },
  { key: "land-cruiser", href: "/search?q=Land+Cruiser", label: "Land Cruiser" },
];

/** Static catalog — rank via `rankMarketQuickSearches` on the server. */
export async function getMarketQuickSearches(
  locale: AppLocale = "ar",
): Promise<MarketQuickSearch[]> {
  return locale === "en" ? QUICK_SEARCHES_EN : QUICK_SEARCHES_AR;
}

export async function getMarketEscrowSteps(): Promise<MarketEscrowStep[]> {
  return [
    {
      icon: "wallet",
      title: "حجز المبلغ",
      description: "يُحجز المبلغ بأمان في محفظة الضمان حتى اكتمال الصفقة.",
    },
    {
      icon: "package",
      title: "تسليم المنتج",
      description: "البائع يسلّم المنتج أو ينفّذ الخدمة حسب الاتفاق.",
    },
    {
      icon: "check",
      title: "تأكيد الاستلام",
      description: "المشتري يفحص المنتج ويؤكد مطابقته للإعلان.",
    },
    {
      icon: "shield",
      title: "تحرير الدفع",
      description: "يُحوَّل المبلغ للبائع بعد التأكيد أو حل النزاع.",
    },
    {
      icon: "message",
      title: "دعم النزاعات",
      description: `فريق ${BRAND.nameAr} يتدخل عند وجود اختلاف بين الطرفين.`,
    },
  ];
}

export const escrowProtectionSteps = [
  "حجز المبلغ في محفظة آمنة",
  "تسليم المنتج أو الخدمة",
  "تأكيد المشتري للاستلام",
  "تحرير الدفع للبائع",
] as const;

export const listingSafetyTips = [
  "التقِ في مكان عام عند المعاينة — خاصة للسيارات والعقارات.",
  "استخدم الضمان المالي بدلاً من التحويل المباشر للمبالغ الكبيرة.",
  "تحقق من هوية البائع وشارة التوثيق قبل الدفع.",
  "لا تشارك رموز التحقق أو بيانات بطاقتك عبر المحادثة.",
  "وثّق حالة المنتج بالصور قبل وبعد الاستلام.",
] as const;

export async function getEscrowProtectionSteps(): Promise<string[]> {
  return [...escrowProtectionSteps];
}

export async function getListingSafetyTips(): Promise<string[]> {
  return [...listingSafetyTips];
}

export async function getMarketEmirateImages(): Promise<Record<string, string>> {
  return {
    dubai: getEmirateImageUrl("dubai"),
    "abu-dhabi": getEmirateImageUrl("abu-dhabi"),
    sharjah: getEmirateImageUrl("sharjah"),
    ajman: getEmirateImageUrl("ajman"),
    "umm-al-quwain": getEmirateImageUrl("umm-al-quwain"),
    "ras-al-khaimah": getEmirateImageUrl("ras-al-khaimah"),
    fujairah: getEmirateImageUrl("fujairah"),
  };
}
