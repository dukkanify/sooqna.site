import type { CategoryFieldOption } from "@/types";
import {
  getVehicleMakes,
  getVehicleModelsForMake,
  resolveVehicleMakeName,
  vehicleModelOptionsForMake,
} from "@/shared/vehicles";

/** Brand → models derived from the canonical vehicle catalog. */
export const CAR_BRAND_MODELS: Record<string, readonly string[]> =
  Object.fromEntries(
    getVehicleMakes().map((make) => [
      make.nameEn,
      getVehicleModelsForMake(make.nameEn).map((model) => model.nameEn),
    ]),
  );

export const MOBILE_BRAND_MODELS: Record<string, readonly string[]> = {
  Apple: [
    "iPhone 16 Pro Max",
    "iPhone 16 Pro",
    "iPhone 16",
    "iPhone 16 Plus",
    "iPhone 15 Pro Max",
    "iPhone 15 Pro",
    "iPhone 15",
    "iPhone 14 Pro Max",
    "iPhone 14 Pro",
    "iPhone 14",
    "iPhone 13",
    "iPhone 12",
    "iPad Pro",
    "iPad Air",
    "Apple Watch Ultra 2",
    "Apple Watch Series 10",
  ],
  Samsung: [
    "Galaxy S25 Ultra",
    "Galaxy S25",
    "Galaxy S24 Ultra",
    "Galaxy S24",
    "Galaxy Z Fold",
    "Galaxy Z Flip",
    "Galaxy A55",
    "Galaxy A35",
    "Galaxy Tab S9",
    "Galaxy Watch",
  ],
  Huawei: ["Pura 70", "P60", "Mate 60", "Nova 12", "Watch GT"],
  Xiaomi: ["14 Ultra", "14", "13T", "Redmi Note 13", "Poco F6", "Mix Fold"],
  Google: ["Pixel 9 Pro", "Pixel 9", "Pixel 8 Pro", "Pixel 8", "Pixel 7"],
  OnePlus: ["12", "12R", "Nord 3", "Open"],
  OPPO: ["Find X7", "Reno 12", "A79"],
  vivo: ["X100", "V30", "Y100"],
  Honor: ["Magic 6", "200", "X9b"],
  Nothing: ["Phone (2)", "Phone (2a)", "Ear (2)"],
  Sony: ["Xperia 1 VI", "Xperia 5 V"],
  Nokia: ["G42", "XR21", "C32"],
};

export const ELECTRONICS_BRAND_MODELS: Record<string, readonly string[]> = {
  Apple: ["MacBook Pro", "MacBook Air", "iMac", "Mac mini", "Mac Studio"],
  Sony: ["PlayStation 5", "Bravia OLED", "WH-1000XM5", "Alpha A7"],
  Samsung: ["OLED TV", "QLED", "Galaxy Book", "The Frame"],
  LG: ["OLED C3", "OLED G3", "Gram", "Soundbar"],
  Dell: ["XPS 15", "XPS 13", "UltraSharp", "Alienware"],
  HP: ["Spectre", "Pavilion", "EliteBook", "OMEN"],
  Lenovo: ["ThinkPad", "Yoga", "Legion", "IdeaPad"],
  Canon: ["EOS R6", "EOS R5", "EOS R50", "PowerShot"],
  Bose: ["Soundbar 900", "QuietComfort", "SoundLink"],
  Nintendo: ["Switch OLED", "Switch Lite"],
  PlayStation: ["PS5", "PS5 Slim", "DualSense"],
  Microsoft: ["Xbox Series X", "Xbox Series S", "Surface"],
};

const OTHER: CategoryFieldOption = { label: "أخرى", value: "أخرى" };

function toOptions(models: readonly string[]): CategoryFieldOption[] {
  return [...models.map((model) => ({ label: model, value: model })), OTHER];
}

/**
 * Model options for a brand.
 * Empty brand → empty list (caller shows "pick make first" / loading — never
 * flash «أخرى» alone as a temporary placeholder).
 */
export function getModelsForBrand(
  categoryId: string | undefined,
  brand: string | undefined,
): CategoryFieldOption[] {
  const key = brand?.trim();
  if (!key) return [];

  if (categoryId === "cars") {
    const canonical = resolveVehicleMakeName(key) ?? key;
    return vehicleModelOptionsForMake(canonical);
  }
  if (categoryId === "mobiles") {
    const models = MOBILE_BRAND_MODELS[key];
    return models ? toOptions(models) : [OTHER];
  }
  if (categoryId === "electronics") {
    const models = ELECTRONICS_BRAND_MODELS[key];
    return models ? toOptions(models) : [OTHER];
  }
  return [OTHER];
}

/** Resolve brand from free text (title) using known brand keys / aliases. */
export function detectBrandFromText(
  categoryId: string,
  text: string,
): string | undefined {
  if (categoryId === "cars") {
    const hay = text.toLowerCase();
    const brands = Object.keys(CAR_BRAND_MODELS).sort(
      (a, b) => b.length - a.length,
    );
    for (const brand of brands) {
      if (hay.includes(brand.toLowerCase())) return brand;
    }
    for (const token of text.split(/[\s,/|-]+/)) {
      const hit = resolveVehicleMakeName(token);
      if (hit) return hit;
    }
    return resolveVehicleMakeName(text) ?? undefined;
  }

  const map =
    categoryId === "mobiles"
      ? MOBILE_BRAND_MODELS
      : categoryId === "electronics"
        ? ELECTRONICS_BRAND_MODELS
        : null;
  if (!map) return undefined;
  const hay = text.toLowerCase();
  const brands = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const brand of brands) {
    if (hay.includes(brand.toLowerCase())) return brand;
  }
  return undefined;
}

export function detectModelFromText(
  categoryId: string,
  brand: string | undefined,
  text: string,
): string | undefined {
  if (!brand) return undefined;
  const options = getModelsForBrand(categoryId, brand);
  const hay = text.toLowerCase();
  const ranked = [...options]
    .filter((item) => item.value !== "أخرى")
    .sort((a, b) => b.value.length - a.value.length);
  for (const option of ranked) {
    if (hay.includes(option.value.toLowerCase())) return option.value;
  }
  return undefined;
}
