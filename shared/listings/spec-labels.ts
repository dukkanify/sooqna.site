/**
 * User-facing Arabic names for listing spec keys/values.
 * Never show camelCase / snake_case API keys on the marketplace.
 */

/** Exact key → Arabic label (covers leftover specs and admin custom fields). */
export const SPEC_KEY_LABELS: Record<string, string> = {
  priceBasis: "أساس السعر",
  rentalPeriod: "مدة الإيجار",
  advertiserRole: "نوع المعلن",
  advertiserType: "نوع المعلن",
  bookTitle: "عنوان الكتاب",
  author: "المؤلف",
  isbn: "ISBN",
  pages: "عدد الصفحات",
  publisher: "الناشر",
  language: "اللغة",
  edition: "الطبعة",
  genre: "التصنيف",
  format: "الصيغة",
  sportType: "نوع الرياضة",
  size: "المقاس",
  clothingSize: "مقاس الملابس",
  shoeSize: "مقاس الحذاء",
  condition: "الحالة",
  color: "اللون",
  colour: "اللون",
  brand: "الماركة",
  model: "الموديل",
  year: "السنة",
  gender: "الجنس",
  ageGroup: "الفئة العمرية",
  age: "العمر",
  material: "الخامة",
  weight: "الوزن",
  quantity: "الكمية",
  details: "تفاصيل إضافية",
  title: "العنوان",
  description: "الوصف",
  listingType: "نوع الإعلان",
  saleType: "نوع البيع",
  furnitureType: "نوع الأثاث",
  animalType: "نوع الحيوان",
  propertyType: "نوع العقار",
  fuelType: "نوع الوقود",
  bodyType: "نوع الهيكل",
  employmentType: "نوع التوظيف",
  serviceCategory: "تصنيف الخدمة",
  businessName: "اسم النشاط",
  coverageArea: "منطقة التغطية",
  unitPrice: "سعر الوحدة",
  engineSize: "سعة المحرك",
  batteryHealth: "صحة البطارية",
  numberOfKeys: "عدد المفاتيح",
  regionalSpecs: "المواصفات الإقليمية",
  exteriorColor: "اللون الخارجي",
  interiorColor: "اللون الداخلي",
  accidentHistory: "سجل الحوادث",
  serviceHistory: "سجل الصيانة",
  availabilityDate: "تاريخ التوفر",
  expectedHandoverDate: "موعد التسليم المتوقع",
  availabilityTiming: "موعد التوفر",
  completionStatus: "حالة الإنجاز",
  titleDeedReady: "سند الملكية جاهز",
  regulatoryAuthority: "الجهة التنظيمية",
  licenseNumber: "رقم الترخيص",
  buildingName: "اسم المبنى",
  unitNumber: "رقم الوحدة",
  totalFloors: "عدد الطوابق",
  floor: "الطابق",
  community: "المجتمع",
  developer: "المطور",
  purpose: "الغرض",
  furnished: "التأثيث",
  bedrooms: "غرف النوم",
  bathrooms: "الحمامات",
  parking: "مواقف السيارات",
  mileage: "العداد",
  transmission: "ناقل الحركة",
  drivetrain: "نظام الدفع",
  cylinders: "الأسطوانات",
  horsepower: "القدرة",
  warranty: "الضمان",
  storage: "التخزين",
  ram: "الذاكرة",
  purchaseDate: "تاريخ الشراء",
  accessoriesIncluded: "الملحقات المرفقة",
  accessories: "الملحقات",
  defects: "العيوب",
  company: "الشركة",
  position: "المسمى الوظيفي",
  salary: "الراتب",
  experience: "الخبرة",
  availability: "التوفر",
  location: "الموقع",
  nationality: "الجنسية",
  breed: "السلالة",
  vaccinated: "مطعم",
  delivery: "التوصيل",
  cuisine: "المطبخ",
  portion: "الحصة",
  freshness: "الطزاجة",
  city: "المدينة",
  emirate: "الإمارة",
  area: "المساحة",
  areaSqft: "المساحة",
  features: "الميزات",
  vin: "رقم الهيكل",
  modelOther: "الموديل (أخرى)",
  furnitureTypeOther: "نوع الأثاث (أخرى)",
  animalTypeOther: "النوع (أخرى)",
  exteriorColorOther: "اللون الخارجي (أخرى)",
  interiorColorOther: "اللون الداخلي (أخرى)",
};

/** Stored English/API enum → Arabic. Keys are lowercase. */
export const SPEC_VALUE_LABELS: Record<string, string> = {
  yearly: "سنوي",
  monthly: "شهري",
  weekly: "أسبوعي",
  daily: "يومي",
  hourly: "بالساعة",
  owner: "مالك",
  broker: "وسيط",
  agent: "وكيل",
  landlord: "مؤجر",
  tenant: "مستأجر",
  seller: "بائع",
  dealer: "معرض",
  private: "فرد",
  company: "شركة",
  new: "جديد",
  used: "مستعمل",
  excellent: "ممتاز",
  good: "جيد",
  fair: "مقبول",
  poor: "ضعيف",
  refurbished: "مجدّد",
  for_parts: "للقطع",
  "for-parts": "للقطع",
  forparts: "للقطع",
  not_working: "لا يعمل",
  "not-working": "لا يعمل",
  notworking: "لا يعمل",
  wholesale: "بالجملة",
  retail: "تجزئة",
  vacancy: "توظيف",
  seeker: "باحث عن عمل",
  other: "أخرى",
  yes: "نعم",
  no: "لا",
  true: "نعم",
  false: "لا",
  furnished: "مفروش",
  unfurnished: "غير مفروش",
  semi_furnished: "شبه مفروش",
  "semi-furnished": "شبه مفروش",
  sale: "للبيع",
  rent: "للإيجار",
  buy: "للبيع",
  lease: "للإيجار",
  male: "ذكر",
  female: "أنثى",
  unisex: "للجنسين",
  hardcover: "غلاف مقوى",
  paperback: "ورقي",
  ebook: "إلكتروني",
  arabic: "العربية",
  english: "الإنجليزية",
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
};

const TOKEN_AR: Record<string, string> = {
  price: "السعر",
  basis: "أساس",
  advertiser: "المعلن",
  role: "دور",
  type: "نوع",
  book: "الكتاب",
  title: "عنوان",
  sport: "الرياضة",
  size: "المقاس",
  condition: "الحالة",
  author: "المؤلف",
  isbn: "ISBN",
  pages: "الصفحات",
  publisher: "الناشر",
  language: "اللغة",
  color: "اللون",
  colour: "اللون",
  brand: "الماركة",
  model: "الموديل",
  year: "السنة",
  gender: "الجنس",
  age: "العمر",
  group: "الفئة",
  material: "الخامة",
  weight: "الوزن",
  length: "الطول",
  width: "العرض",
  height: "الارتفاع",
  quantity: "الكمية",
  rental: "الإيجار",
  period: "المدة",
  duration: "المدة",
  frequency: "التكرار",
  deposit: "التأمين",
  furnished: "التأثيث",
  bedrooms: "غرف النوم",
  bathrooms: "الحمامات",
  parking: "المواقف",
  mileage: "العداد",
  transmission: "ناقل الحركة",
  fuel: "الوقود",
  engine: "المحرك",
  capacity: "السعة",
  storage: "التخزين",
  ram: "الذاكرة",
  battery: "البطارية",
  health: "صحة",
  warranty: "الضمان",
  location: "الموقع",
  city: "المدينة",
  emirate: "الإمارة",
  area: "المساحة",
  community: "المجتمع",
  developer: "المطور",
  purpose: "الغرض",
  listing: "الإعلان",
  salary: "الراتب",
  experience: "الخبرة",
  company: "الشركة",
  position: "المسمى",
  availability: "التوفر",
  nationality: "الجنسية",
  breed: "السلالة",
  animal: "الحيوان",
  vaccinated: "التطعيم",
  delivery: "التوصيل",
  cuisine: "المطبخ",
  portion: "الحصة",
  freshness: "الطزاجة",
  sale: "البيع",
  unit: "الوحدة",
  service: "الخدمة",
  category: "التصنيف",
  coverage: "التغطية",
  business: "النشاط",
  name: "الاسم",
  details: "التفاصيل",
  features: "الميزات",
  accessories: "الملحقات",
  included: "المرفقة",
  purchase: "الشراء",
  date: "التاريخ",
  number: "عدد",
  keys: "المفاتيح",
  vin: "رقم الهيكل",
  cylinders: "الأسطوانات",
  horsepower: "القدرة",
  drivetrain: "نظام الدفع",
  body: "الهيكل",
  exterior: "الخارجي",
  interior: "الداخلي",
  regional: "الإقليمية",
  specs: "المواصفات",
  accident: "الحوادث",
  history: "سجل",
  other: "أخرى",
  floor: "الطابق",
  floors: "الطوابق",
  total: "إجمالي",
  building: "المبنى",
  expected: "المتوقع",
  handover: "التسليم",
  timing: "التوقيت",
  completion: "الإنجاز",
  status: "الحالة",
  property: "العقار",
  regulatory: "التنظيمية",
  authority: "الجهة",
  license: "الترخيص",
  furniture: "الأثاث",
  employment: "التوظيف",
  edition: "الطبعة",
  genre: "التصنيف",
  format: "الصيغة",
  clothing: "الملابس",
  shoe: "الحذاء",
  shoes: "الأحذية",
  style: "النمط",
  pattern: "النقش",
  skill: "المهارة",
  level: "المستوى",
  season: "الموسم",
  team: "الفريق",
  league: "الدوري",
  player: "اللاعب",
  count: "العدد",
  isbn13: "ISBN",
};

export function looksLikeApiKey(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^[a-z]+[A-Z][A-Za-z0-9]*$/.test(trimmed)) return true;
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(trimmed)) return true;
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(trimmed) && trimmed.includes("-")) {
    return !/^(for|not)-/.test(trimmed);
  }
  return false;
}

export function splitSpecKey(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function camelizeSpecKey(key: string): string {
  return key.replace(/[-_]([a-z0-9])/gi, (_, ch: string) => ch.toUpperCase());
}

export function humanizeSpecKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return trimmed;
  if (/[\u0600-\u06FF]/.test(trimmed)) return trimmed;

  const exact = SPEC_KEY_LABELS[trimmed] ?? SPEC_KEY_LABELS[camelizeSpecKey(trimmed)];
  if (exact) return exact;

  const tokens = splitSpecKey(trimmed);
  if (tokens.length === 0) return trimmed;

  const mapped = tokens.map((token) => TOKEN_AR[token]);
  if (mapped.every(Boolean) && mapped.length > 0) {
    return [...mapped].reverse().join(" ").replace(/\s+/g, " ").trim();
  }

  const known = mapped.filter((item): item is string => Boolean(item));
  if (known.length > 0 && known.length >= tokens.length - 1) {
    return [...known].reverse().join(" ").trim();
  }

  return tokens.join(" ");
}

export function translateSpecValueToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/[\u0600-\u06FF]/.test(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  const underscored = lower.replace(/[\s-]+/g, "_");
  const dashed = lower.replace(/[\s_]+/g, "-");
  const compact = lower.replace(/[\s_-]+/g, "");
  return (
    SPEC_VALUE_LABELS[lower] ??
    SPEC_VALUE_LABELS[underscored] ??
    SPEC_VALUE_LABELS[dashed] ??
    SPEC_VALUE_LABELS[compact] ??
    trimmed
  );
}
