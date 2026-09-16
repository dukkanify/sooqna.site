import type { CategoryFieldDefinition, CategoryIconName } from "@/types";
import { getCategoryFields } from "@/shared/constants/category-fields";

export type CategoryProfilePrimaryAction =
  | "BUY_NOW"
  | "CONTACT_SELLER"
  | "BOOK_VIEWING"
  | "REQUEST_QUOTE"
  | "APPLY_JOB"
  | "BOOK_SERVICE"
  | "SEND_MESSAGE";

/**
 * Marketplace behavior for a category. Admin picks one when creating a section;
 * listing CTAs, checkout, escrow, and form seeding follow this profile.
 */
export type CategoryFeatureProfile =
  | "goods"
  | "vehicles"
  | "real_estate"
  | "jobs"
  | "services"
  | "food"
  | "general";

export type CategoryFeatureProfileMeta = {
  id: CategoryFeatureProfile;
  label: string;
  description: string;
  /** What the seller/buyer flow unlocks in product terms. */
  capabilities: string[];
  defaultIcon: CategoryIconName;
  /** Seed add-listing fields from this built-in category template. */
  formTemplateId: string;
  primaryAction: CategoryProfilePrimaryAction;
  checkoutEnabled: boolean;
  purchasable: boolean;
  escrowEligible: boolean;
  imagesRequired: boolean;
};

export const CATEGORY_FEATURE_PROFILES: CategoryFeatureProfileMeta[] = [
  {
    id: "goods",
    label: "سلع قابلة للشراء",
    description:
      "منتجات تُباع أونلاين مع شراء الآن و الضمان المالي عند تفعيل الدفع.",
    capabilities: ["شراء الآن", "ضمان مالي", "شحن/استلام", "نموذج منتج"],
    defaultIcon: "laptop",
    formTemplateId: "furniture",
    primaryAction: "BUY_NOW",
    checkoutEnabled: true,
    purchasable: true,
    escrowEligible: true,
    imagesRequired: true,
  },
  {
    id: "vehicles",
    label: "مركبات",
    description: "سيارات ومركبات — تواصل مع البائع بدون شراء أونلاين.",
    capabilities: ["تواصل مع البائع", "حقول ماركة/موديل", "بدون ضمان مالي"],
    defaultIcon: "car",
    formTemplateId: "cars",
    primaryAction: "CONTACT_SELLER",
    checkoutEnabled: false,
    purchasable: false,
    escrowEligible: false,
    imagesRequired: true,
  },
  {
    id: "real_estate",
    label: "عقارات",
    description: "عقارات للبيع أو الإيجار مع طلب معاينة / استفسار.",
    capabilities: ["استفسر عن العقار", "حقول عقار", "بدون شراء أونلاين"],
    defaultIcon: "home",
    formTemplateId: "real-estate",
    primaryAction: "BOOK_VIEWING",
    checkoutEnabled: false,
    purchasable: false,
    escrowEligible: false,
    imagesRequired: true,
  },
  {
    id: "jobs",
    label: "وظائف",
    description: "شواغر وظيفية مع تقديم على الوظيفة ورفع السيرة.",
    capabilities: ["تقديم على الوظيفة", "بدون صور إلزامية", "نموذج توظيف"],
    defaultIcon: "briefcase",
    formTemplateId: "jobs",
    primaryAction: "APPLY_JOB",
    checkoutEnabled: false,
    purchasable: false,
    escrowEligible: false,
    imagesRequired: false,
  },
  {
    id: "services",
    label: "خدمات",
    description: "خدمات مهنية مع طلب عرض سعر أو حجز خدمة.",
    capabilities: ["طلب عرض سعر", "طلب الخدمة", "نموذج خدمة"],
    defaultIcon: "wrench",
    formTemplateId: "services",
    primaryAction: "REQUEST_QUOTE",
    checkoutEnabled: false,
    purchasable: false,
    escrowEligible: false,
    imagesRequired: true,
  },
  {
    id: "food",
    label: "طعام",
    description: "أطعمة ومشروبات — بيع بالتجزئة أو جملة (عرض سعر).",
    capabilities: ["شراء/عرض سعر حسب النوع", "حقول طعام"],
    defaultIcon: "food",
    formTemplateId: "food",
    primaryAction: "BUY_NOW",
    checkoutEnabled: true,
    purchasable: true,
    escrowEligible: true,
    imagesRequired: true,
  },
  {
    id: "general",
    label: "إعلان عام",
    description: "تصنيف مرن — تواصل مع البائع وحقول أساسية قابلة للتخصيص.",
    capabilities: ["تواصل مع البائع", "نموذج بسيط", "قابل للتوسيع من منشئ النماذج"],
    defaultIcon: "sofa",
    formTemplateId: "furniture",
    primaryAction: "CONTACT_SELLER",
    checkoutEnabled: false,
    purchasable: false,
    escrowEligible: false,
    imagesRequired: true,
  },
];

const PROFILE_BY_ID = Object.fromEntries(
  CATEGORY_FEATURE_PROFILES.map((profile) => [profile.id, profile]),
) as Record<CategoryFeatureProfile, CategoryFeatureProfileMeta>;

/** Built-in marketplace sections → profile (keeps legacy IDs working). */
export const BUILTIN_CATEGORY_PROFILES: Record<string, CategoryFeatureProfile> = {
  cars: "vehicles",
  "real-estate": "real_estate",
  electronics: "goods",
  mobiles: "goods",
  furniture: "goods",
  fashion: "goods",
  kids: "goods",
  sports: "goods",
  books: "goods",
  jobs: "jobs",
  services: "services",
  food: "food",
  pets: "general",
};

export function isCategoryFeatureProfile(
  value: string | null | undefined,
): value is CategoryFeatureProfile {
  return Boolean(value && value in PROFILE_BY_ID);
}

export function getCategoryFeatureProfileMeta(
  profile: CategoryFeatureProfile,
): CategoryFeatureProfileMeta {
  return PROFILE_BY_ID[profile];
}

export function resolveCategoryFeatureProfile(
  categoryId: string,
  explicit?: CategoryFeatureProfile | null,
): CategoryFeatureProfile {
  if (explicit && isCategoryFeatureProfile(explicit)) return explicit;
  return BUILTIN_CATEGORY_PROFILES[categoryId] ?? "general";
}

export function getFormTemplateFields(
  profile: CategoryFeatureProfile,
): CategoryFieldDefinition[] {
  const meta = getCategoryFeatureProfileMeta(profile);
  const fields = getCategoryFields(meta.formTemplateId);
  if (fields.length > 0) return fields;
  return [
    {
      key: "condition",
      label: "الحالة",
      type: "select",
      required: true,
      options: [
        { label: "جديد", value: "new" },
        { label: "مستعمل", value: "used" },
        { label: "ممتاز", value: "excellent" },
      ],
    },
    {
      key: "details",
      label: "تفاصيل إضافية",
      type: "textarea",
      required: false,
      placeholder: "أي مواصفات مهمة للمشتري",
    },
  ];
}

/** Icons allowed on categories (must match CategoryIconName). */
export const CATEGORY_ICON_OPTIONS: { label: string; value: CategoryIconName }[] = [
  { label: "سيارة", value: "car" },
  { label: "عقار", value: "home" },
  { label: "لابتوب", value: "laptop" },
  { label: "جوال", value: "phone" },
  { label: "أثاث", value: "sofa" },
  { label: "حقيبة/وظيفة", value: "briefcase" },
  { label: "ساعة", value: "watch" },
  { label: "حيوانات", value: "paw" },
  { label: "خدمات", value: "wrench" },
  { label: "أطفال", value: "baby" },
  { label: "كتب", value: "book" },
  { label: "رياضة", value: "sport" },
  { label: "طعام", value: "food" },
];

/** Build a URL-safe slug from Arabic or Latin category names. */
export function slugifyCategoryName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return "";

  const arabicMap: Record<string, string> = {
    ا: "a",
    أ: "a",
    إ: "i",
    آ: "a",
    ب: "b",
    ت: "t",
    ث: "th",
    ج: "j",
    ح: "h",
    خ: "kh",
    د: "d",
    ذ: "dh",
    ر: "r",
    ز: "z",
    س: "s",
    ش: "sh",
    ص: "s",
    ض: "d",
    ط: "t",
    ظ: "z",
    ع: "a",
    غ: "gh",
    ف: "f",
    ق: "q",
    ك: "k",
    ل: "l",
    م: "m",
    ن: "n",
    ه: "h",
    و: "w",
    ي: "y",
    ى: "a",
    ة: "h",
    ء: "",
    ئ: "y",
    ؤ: "w",
    " ": "-",
  };

  let out = "";
  for (const char of trimmed) {
    if (/[a-z0-9-]/.test(char)) {
      out += char;
      continue;
    }
    if (arabicMap[char] !== undefined) {
      out += arabicMap[char];
      continue;
    }
    if (/\s/.test(char)) out += "-";
  }
  return out
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
