import type { CategoryFieldOption } from "@/types";

/** Brand → models for cascading search/add-listing filters. */
export const CAR_BRAND_MODELS: Record<string, readonly string[]> = {
  Toyota: [
    "Land Cruiser",
    "Land Cruiser Prado",
    "Camry",
    "Corolla",
    "Hilux",
    "Yaris",
    "Fortuner",
    "RAV4",
    "Highlander",
    "Avalon",
    "Supra",
  ],
  Nissan: [
    "Patrol",
    "Altima",
    "Sunny",
    "X-Trail",
    "Kicks",
    "Pathfinder",
    "Maxima",
    "Navara",
    "GT-R",
  ],
  Honda: ["Accord", "Civic", "CR-V", "HR-V", "Pilot", "City", "Odyssey"],
  Lexus: [
    "LX",
    "LX 600",
    "GX",
    "RX",
    "NX",
    "ES",
    "IS",
    "GS",
    "LS",
    "UX",
    "RC",
    "LC",
  ],
  "Mercedes-Benz": [
    "G-Class",
    "G63",
    "C-Class",
    "E-Class",
    "S-Class",
    "GLC",
    "GLE",
    "GLS",
    "A-Class",
    "CLA",
    "Maybach",
  ],
  BMW: [
    "X7",
    "X5",
    "X3",
    "X1",
    "X6",
    "3 Series",
    "5 Series",
    "7 Series",
    "M3",
    "M5",
    "iX",
    "i4",
  ],
  Audi: ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron", "RS6"],
  Porsche: ["Cayenne", "Macan", "Panamera", "911", "Taycan", "Cayman", "Boxster"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover"],
  "Range Rover": [
    "Range Rover",
    "Range Rover Sport",
    "Range Rover Velar",
    "Range Rover Evoque",
  ],
  Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator", "Renegade"],
  Ford: ["F-150", "Mustang", "Explorer", "Edge", "Escape", "Ranger", "Bronco"],
  Chevrolet: ["Tahoe", "Suburban", "Silverado", "Malibu", "Traverse", "Camaro"],
  GMC: ["Yukon", "Sierra", "Terrain", "Acadia", "Canyon"],
  Hyundai: ["Tucson", "Santa Fe", "Elantra", "Sonata", "Palisade", "Creta", "Accent"],
  Kia: ["Sportage", "Sorento", "K5", "Cerato", "Telluride", "Carnival", "Seltos"],
  Mazda: ["CX-5", "CX-9", "CX-30", "Mazda3", "Mazda6", "MX-5"],
  Mitsubishi: ["Pajero", "Outlander", "Lancer", "ASX", "Montero", "L200"],
  Volkswagen: ["Tiguan", "Touareg", "Golf", "Passat", "Teramont", "ID.4"],
  Volvo: ["XC90", "XC60", "XC40", "S90", "S60"],
  Tesla: ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck"],
  Infiniti: ["QX80", "QX60", "QX55", "Q50", "Q60"],
  Genesis: ["G70", "G80", "G90", "GV70", "GV80"],
  Suzuki: ["Swift", "Jimny", "Vitara", "Ertiga", "Ciaz"],
  Subaru: ["Outback", "Forester", "XV", "Impreza", "WRX"],
  Dodge: ["Charger", "Challenger", "Durango", "Ram"],
  Jaguar: ["F-Pace", "E-Pace", "XF", "XE", "F-Type"],
  Bentley: ["Bentayga", "Continental", "Flying Spur"],
  "Rolls-Royce": ["Cullinan", "Ghost", "Phantom", "Wraith"],
  Ferrari: ["Roma", "SF90", "488", "F8", "Purosangue"],
  Lamborghini: ["Urus", "Huracán", "Aventador", "Revuelto"],
  Maserati: ["Levante", "Ghibli", "Quattroporte", "Grecale"],
  Geely: ["Coolray", "Monjaro", "Okavango", "Emgrand"],
  MG: ["MG5", "MG6", "ZS", "HS", "RX5"],
  BYD: ["Han", "Tang", "Seal", "Atto 3", "Song"],
  Isuzu: ["D-Max", "MU-X"],
};

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

export function getModelsForBrand(
  categoryId: string | undefined,
  brand: string | undefined,
): CategoryFieldOption[] {
  const key = brand?.trim();
  if (!key) return [OTHER];

  if (categoryId === "cars") {
    const models = CAR_BRAND_MODELS[key];
    return models ? toOptions(models) : [OTHER];
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

/** Resolve brand from free text (title) using known brand keys. */
export function detectBrandFromText(
  categoryId: string,
  text: string,
): string | undefined {
  const map =
    categoryId === "cars"
      ? CAR_BRAND_MODELS
      : categoryId === "mobiles"
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
  // Arabic aliases for common car brands
  if (categoryId === "cars") {
    const ar: Record<string, string> = {
      تويوتا: "Toyota",
      نيسان: "Nissan",
      هوندا: "Honda",
      لكزس: "Lexus",
      مرسيدس: "Mercedes-Benz",
      "بي إم دبليو": "BMW",
      "بي ام دبليو": "BMW",
      أودي: "Audi",
      بورش: "Porsche",
      "لاند روفر": "Land Rover",
      "رنج روفر": "Range Rover",
      جيب: "Jeep",
      فورد: "Ford",
      شيفروليه: "Chevrolet",
      "جي إم سي": "GMC",
      هيونداي: "Hyundai",
      كيا: "Kia",
      مازدا: "Mazda",
      ميتسوبيشي: "Mitsubishi",
      "فولكس واجن": "Volkswagen",
      فولفو: "Volvo",
      تسلا: "Tesla",
      إنفينيتي: "Infiniti",
      جينيسيس: "Genesis",
      سوزوكي: "Suzuki",
      سوبارو: "Subaru",
      دودج: "Dodge",
      جاكوار: "Jaguar",
      بنتلي: "Bentley",
      "رولز رويس": "Rolls-Royce",
      فيراري: "Ferrari",
      لامبورغيني: "Lamborghini",
      مازيراتي: "Maserati",
      جيلي: "Geely",
      "إم جي": "MG",
      "بي واي دي": "BYD",
      إيسوزو: "Isuzu",
    };
    for (const [label, brand] of Object.entries(ar)) {
      if (text.includes(label)) return brand;
    }
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
