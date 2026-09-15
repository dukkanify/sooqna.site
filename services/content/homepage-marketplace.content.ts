import { BRAND } from "@/shared/constants/brand";
import { getEmirateImageUrl, heroBackgroundUrl } from "@/shared/constants/image-fallbacks";

export type MarketEscrowStep = {
  description: string;
  icon: string;
  title: string;
};

export async function getMarketHeroBackground(): Promise<string> {
  return heroBackgroundUrl;
}

export async function getMarketQuickSearches() {
  return [
    { href: "/search?q=مرسيدس", label: "مرسيدس" },
    { href: "/search?q=باترول", label: "باترول" },
    { href: "/search?q=جزيرة+ياس", label: "جزيرة ياس" },
    { href: "/search?q=كورنيش+أبوظبي", label: "كورنيش أبوظبي" },
    { href: "/search?q=شقة", label: "شقة" },
    { href: "/search?q=فيلا", label: "فيلا" },
    { href: "/search?q=آيفون", label: "آيفون" },
    { href: "/search?q=مكتب", label: "مكتب" },
    { href: "/search?q=ماك+بوك", label: "ماك بوك" },
    { href: "/search?q=لاند+كروزر", label: "لاند كروزر" },
  ];
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
