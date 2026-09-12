import type { Listing, ListingCondition, ListingImageTone, ListingSeller } from "@/types";
import type { ImageFallbackCategory } from "@/shared/constants/image-fallbacks";
import { galleryForListingProduct } from "@/shared/constants/listing-product-media";
import {
  detectBrandFromText,
  detectModelFromText,
} from "@/shared/constants/product-brand-models";
import { LIVE_CARS_ALL_BRANDS } from "@/services/listings/live-cars-all-brands";

/** Provenance marker — not showcase/demo; public catalog keeps these. */
export const LIVE_MARKETPLACE_SOURCE = "SOOQNA_LIVE_MARKETPLACE";
export const LIVE_MARKETPLACE_COUNT = 172;

type EmiratePack = {
  emirate: string;
  areas: string[];
};

const EMIRATES: EmiratePack[] = [
  { emirate: "دبي", areas: ["دبي مارينا", "الخليج التجاري", "جميرا", "البرشاء", "ند الشبا"] },
  { emirate: "أبوظبي", areas: ["جزيرة ياس", "الخالدية", "الريم", "المشرف", "البطين"] },
  { emirate: "الشارقة", areas: ["الناصرية", "المجاز", "الفلج", "المجاز 3", "القلعة"] },
  { emirate: "عجمان", areas: ["الراشدية", "النعيمية", "الجرف", "المويهات"] },
  { emirate: "أم القيوين", areas: ["المدينة القديمة", "الراشدية", "السلمة"] },
  { emirate: "رأس الخيمة", areas: ["النخيل", "الحمرانية", "خزام", "الجزيرة الحمراء"] },
  { emirate: "الفجيرة", areas: ["مدينة الفجيرة", "الفسيل", "الحيل", "قدفع"] },
];

const SELLERS: ListingSeller[] = [
  {
    id: "seller-live-ahmed",
    name: "أحمد المنصوري",
    nameEnglish: "Ahmed Al Mansoori",
    isVerified: true,
    sellerType: "individual",
    rating: 4.9,
    reviewCount: 86,
    responseTime: "خلال ساعة",
    completedTransactions: 42,
  },
  {
    id: "seller-live-sara",
    name: "سارة الكعبي",
    nameEnglish: "Sara Al Kaabi",
    isVerified: true,
    sellerType: "individual",
    rating: 4.8,
    reviewCount: 54,
    responseTime: "خلال ساعتين",
    completedTransactions: 31,
  },
  {
    id: "seller-live-omar",
    name: "عمر الشامسي",
    nameEnglish: "Omar Al Shamsi",
    isVerified: true,
    sellerType: "business",
    rating: 4.7,
    reviewCount: 120,
    responseTime: "خلال 30 دقيقة",
    completedTransactions: 95,
  },
  {
    id: "seller-live-fatima",
    name: "فاطمة الهاشمي",
    nameEnglish: "Fatima Al Hashimi",
    isVerified: true,
    sellerType: "individual",
    rating: 5,
    reviewCount: 28,
    responseTime: "خلال ساعة",
    completedTransactions: 19,
  },
  {
    id: "seller-live-khalid",
    name: "خالد البلوشي",
    nameEnglish: "Khalid Al Balushi",
    isVerified: true,
    sellerType: "business",
    rating: 4.6,
    reviewCount: 201,
    responseTime: "فوري",
    completedTransactions: 160,
  },
  {
    id: "seller-live-maryam",
    name: "مريم الزعابي",
    nameEnglish: "Maryam Al Zaabi",
    isVerified: true,
    sellerType: "individual",
    rating: 4.9,
    reviewCount: 67,
    responseTime: "خلال ساعة",
    completedTransactions: 44,
  },
  {
    id: "seller-live-yousef",
    name: "يوسف المزروعي",
    nameEnglish: "Yousef Al Mazrouei",
    isVerified: true,
    sellerType: "business",
    rating: 4.8,
    reviewCount: 143,
    responseTime: "خلال ساعة",
    completedTransactions: 110,
  },
  {
    id: "seller-live-noura",
    name: "نورة القبيسي",
    nameEnglish: "Noura Al Qubaisi",
    isVerified: true,
    sellerType: "individual",
    rating: 4.7,
    reviewCount: 39,
    responseTime: "خلال ساعتين",
    completedTransactions: 22,
  },
];

type SeedDef = {
  categoryId: string;
  imageCategory: ImageFallbackCategory;
  title: string;
  titleEnglish: string;
  description: string;
  descriptionEnglish: string;
  subcategory: string;
  price: number;
  condition: ListingCondition;
  features: string[];
  featured?: boolean;
};

/** 172 professional UAE marketplace listings (12 featured cars + 72 brand-complete cars + other categories). */
const SEED_DEFS: SeedDef[] = [
  // —— cars (12 core)
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "تويوتا لاندكروزر VX 2023 — فل أوبشن",
    titleEnglish: "Toyota Land Cruiser VX 2023 — Full Option",
    description:
      "لاندكروزر VX 2023 فل أوبشن، مواصفات خليجية، صيانة وكالة، بدون حوادث، جاهزة للتسجيل فوراً. فحص شامل متوفر عند المعاينة.",
    descriptionEnglish:
      "2023 Land Cruiser VX full option, GCC specs, agency service history, accident-free, ready to register. Full inspection available on viewing.",
    subcategory: "سيارات عائلية",
    price: 285000,
    condition: "excellent",
    features: ["دفع رباعي", "مقاعد جلد", "شاشة كبيرة", "كاميرا 360"],
    featured: true,
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "نيسان باترول بلاتينيوم 2022",
    titleEnglish: "Nissan Patrol Platinum 2022",
    description:
      "باترول بلاتينيوم 2022، محرك V8، نظام صوت فاخر، ضمان ساري، استخدام شخصي فقط.",
    descriptionEnglish:
      "2022 Patrol Platinum, V8 engine, premium audio, active warranty, personal use only.",
    subcategory: "سيارات عائلية",
    price: 198000,
    condition: "excellent",
    features: ["V8", "BOSE", "مقاعد مبردة", "ProPILOT"],
    featured: true,
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "مرسيدس G63 AMG 2024",
    titleEnglish: "Mercedes-AMG G63 2024",
    description:
      "جي كلاس AMG 2024 بحالة الوكالة، كيلومترات قليلة، باقة كربون، تأمين شامل قابل للنقل.",
    descriptionEnglish:
      "2024 G-Class AMG in agency condition, low mileage, carbon pack, transferable comprehensive insurance.",
    subcategory: "سيارات فاخرة",
    price: 895000,
    condition: "new",
    features: ["AMG", "باقة كربون", "نظام تعليق", "داخلية فاخرة"],
    featured: true,
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "بي إم دبليو X7 2023 M Sport",
    titleEnglish: "BMW X7 2023 M Sport",
    description:
      "إكس 7 إم سبورت 2023، 7 مقاعد، بانوراما، صيانة دورية في مركز معتمد.",
    descriptionEnglish:
      "2023 X7 M Sport, 7 seats, panoramic roof, serviced at authorized center.",
    subcategory: "سيارات فاخرة",
    price: 365000,
    condition: "excellent",
    features: ["M Sport", "7 مقاعد", "بانوراما", "مساعد قيادة"],
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "تسلا موديل Y Long Range 2024",
    titleEnglish: "Tesla Model Y Long Range 2024",
    description:
      "موديل Y لونج رينج 2024، شحن منزلي مرفق، Autopilot مفعّل، بطارية بحالة ممتازة.",
    descriptionEnglish:
      "2024 Model Y Long Range, home charger included, Autopilot enabled, excellent battery health.",
    subcategory: "كهربائية",
    price: 175000,
    condition: "excellent",
    features: ["كهربائية", "Autopilot", "شحن منزلي", "مدى طويل"],
    featured: true,
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "لكزس LX 600 2023",
    titleEnglish: "Lexus LX 600 2023",
    description:
      "لكزس LX 600 فاخرة، استخدام عائلي، فحص ضمان، جاهزة للمعاينة يومياً.",
    descriptionEnglish:
      "Luxury Lexus LX 600, family use, warranty inspection, available for viewing daily.",
    subcategory: "سيارات فاخرة",
    price: 420000,
    condition: "excellent",
    features: ["Mark Levinson", "دفع رباعي", "مقاعد تهوية", "شاشة خلفية"],
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "هوندا أكورد 2022 سبورت",
    titleEnglish: "Honda Accord 2022 Sport",
    description:
      "أكورد سبورت اقتصادية ومريحة، استهلاك ممتاز، سجل صيانة كامل.",
    descriptionEnglish:
      "Accord Sport — economical and comfortable, excellent fuel economy, full service record.",
    subcategory: "سيدان",
    price: 78000,
    condition: "used",
    features: ["سبورت", "كاميرا خلفية", "حساسات", "بلوتوث"],
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "كيا سبورتاج 2023 GT Line",
    titleEnglish: "Kia Sportage 2023 GT Line",
    description:
      "سبورتاج GT Line، ضمان كيا ساري، مناسبة للعوائل والتنقل اليومي.",
    descriptionEnglish:
      "Sportage GT Line with active Kia warranty — ideal for families and daily commute.",
    subcategory: "كروس أوفر",
    price: 92000,
    condition: "excellent",
    features: ["GT Line", "شاشة كبيرة", "مثبت سرعة", "حساسات أمامية"],
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "فورد F-150 رابتور 2022",
    titleEnglish: "Ford F-150 Raptor 2022",
    description:
      "رابتور للطرق الوعرة، إطارات جديدة، تجهيزات أوف رود كاملة.",
    descriptionEnglish:
      "Off-road Raptor with new tires and full off-road package.",
    subcategory: "بيك أب",
    price: 245000,
    condition: "excellent",
    features: ["Raptor", "أوف رود", "تعليق مرتفع", "صندوق خلفي"],
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "بورش كايين S 2021",
    titleEnglish: "Porsche Cayenne S 2021",
    description:
      "كايين S بحالة ممتازة، باقة سبورت كرونو، فحص وكالة متوفر.",
    descriptionEnglish:
      "Cayenne S in excellent condition, Sport Chrono pack, agency inspection available.",
    subcategory: "سيارات فاخرة",
    price: 310000,
    condition: "excellent",
    features: ["Sport Chrono", "جلد", "نظام صوت", "مساعد ركن"],
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "هيونداي توسان 2024",
    titleEnglish: "Hyundai Tucson 2024",
    description:
      "توسان 2024 جديدة تقريباً، كيلومترات منخفضة جداً، ضمان المصنع.",
    descriptionEnglish:
      "Nearly new 2024 Tucson, very low mileage, factory warranty.",
    subcategory: "كروس أوفر",
    price: 105000,
    condition: "new",
    features: ["ضمان مصنع", "شاشة", "كاميرا", "مثبت ذكي"],
  },
  {
    categoryId: "cars",
    imageCategory: "cars",
    title: "جيب رانجلر أنليميتد 2023",
    titleEnglish: "Jeep Wrangler Unlimited  soft",
    description:
      "رانجلر أنليميتد، سقف قابل للإزالة، مناسب للمغامرات والبر.",
    descriptionEnglish:
      "Wrangler Unlimited with removable top — perfect for desert adventures.",
    subcategory: "أوف رود",
    price: 168000,
    condition: "excellent",
    features: ["سقف قابل للإزالة", "دفع رباعي", "إطارات طرق وعرة"],
  },

  // —— cars (2 real ads for every brand in CAR_BRAND_MODELS)
  ...LIVE_CARS_ALL_BRANDS,

  // —— real-estate (12)
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "فيلا 5 غرف — جميرا",
    titleEnglish: "5-Bedroom Villa — Jumeirah",
    description:
      "فيلا مستقلة 5 غرف ماستر، حديقة خاصة، مسبح، موقف سيارتين، قريبة من الشاطئ والمدارس.",
    descriptionEnglish:
      "Detached 5-bedroom villa with private garden, pool, dual parking — near the beach and schools.",
    subcategory: "فلل للبيع",
    price: 8500000,
    condition: "excellent",
    features: ["مسبح", "حديقة", "خادمة", "موقفين"],
    featured: true,
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "شقة غرفتين مفروشة — داون تاون",
    titleEnglish: "Furnished 2BR — Downtown",
    description:
      "شقة مفروشة بالكامل بإطلالة برج خليفة، إيجار سنوي شامل الصيانة، جاهزة للسكن فوراً.",
    descriptionEnglish:
      "Fully furnished apartment with Burj Khalifa view, annual rent includes maintenance, move-in ready.",
    subcategory: "شقق للإيجار",
    price: 145000,
    condition: "excellent",
    features: ["مفروشة", "إطلالة", "مسبح مشترك", "جيم"],
    featured: true,
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "تاون هاوس 3 غرف — المرابع العربية",
    titleEnglish: "3BR Townhouse — Arabian Ranches",
    description:
      "تاون هاوس هادئ داخل مجمع مسوّر، حديقة خلفية، قريب من النادي والمدارس.",
    descriptionEnglish:
      "Quiet townhouse in a gated community with backyard garden, near clubhouse and schools.",
    subcategory: "تاون هاوس",
    price: 2100000,
    condition: "excellent",
    features: ["مجمع مسوّر", "حديقة", "موقف", "مجتمع عائلي"],
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "مكتب تجاري — الخليج التجاري",
    titleEnglish: "Commercial Office — Business Bay",
    description:
      "مكتب مفتوح 120 م²، طابق مرتفع، استقبال مشترك، مناسب للشركات الناشئة.",
    descriptionEnglish:
      "120 sqm open-plan office on a high floor with shared reception — ideal for startups.",
    subcategory: "مكاتب",
    price: 95000,
    condition: "excellent",
    features: ["طابقة مرتفع", "استقبال", "إنترنت", "مواقف"],
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "استوديو حديث — JVC",
    titleEnglish: "Modern Studio — JVC",
    description:
      "استوديو أنيق مع بلكونة، مطبخ مجهز، إيجار شامل رسوم الخدمة.",
    descriptionEnglish:
      "Stylish studio with balcony and equipped kitchen; rent includes service charges.",
    subcategory: "استوديو",
    price: 48000,
    condition: "new",
    features: ["بلكونة", "مطبخ مجهز", "أمن 24 ساعة"],
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "شقة 3 غرف — الريم أبوظبي",
    titleEnglish: "3BR Apartment — Al Reem Abu Dhabi",
    description:
      "شقة واسعة بإطلالة بحرية جزئية، تشطيب راقي، قريبة من المولات والمدارس.",
    descriptionEnglish:
      "Spacious apartment with partial sea view, premium finishes, near malls and schools.",
    subcategory: "شقق للبيع",
    price: 1650000,
    condition: "excellent",
    features: ["إطلالة بحر", "موقفين", "مسبح", "صالة رياضية"],
    featured: true,
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "فيلا duplex — عجمان",
    titleEnglish: "Duplex Villa — Ajman",
    description:
      "دوبلكس عائلي جديد، 4 غرف، مجلس خارجي، سعر تنافسي مقارنة بدبي.",
    descriptionEnglish:
      "New family duplex with 4 bedrooms and outdoor majlis — competitive vs Dubai prices.",
    subcategory: "فلل للبيع",
    price: 1250000,
    condition: "new",
    features: ["دوبلكس", "مجلس", "موقفين", "تشطيب جديد"],
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "أرض سكنية — رأس الخيمة",
    titleEnglish: "Residential Plot — Ras Al Khaimah",
    description:
      "أرض سكنية بموقع ممتاز، صك ملكية واضح، مناسبة لبناء فيلا خاصة.",
    descriptionEnglish:
      "Residential plot in a prime location with clear title — suitable for a private villa.",
    subcategory: "أراضي",
    price: 680000,
    condition: "new",
    features: ["صك واضح", "موقع مميز", "خدمات قريبة"],
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "شقة غرفة وصالة — الشارقة",
    titleEnglish: "1BR Apartment — Sharjah",
    description:
      "شقة مريحة قريبة من الجامعة والكورنيش، مثالية للعزاب أو الأزواج.",
    descriptionEnglish:
      "Comfortable apartment near the university and corniche — ideal for singles or couples.",
    subcategory: "شقق للإيجار",
    price: 32000,
    condition: "used",
    features: ["قريبة من الكورنيش", "موقف", "مصعد"],
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "بنتهاوس فاخر — دبي مارينا",
    titleEnglish: "Luxury Penthouse — Dubai Marina",
    description:
      "بنتهاوس بطابقين، تراس واسع، إطلالة مارينا كاملة، تشطيب ديزاينر.",
    descriptionEnglish:
      "Two-level penthouse with large terrace, full marina view, and designer finishes.",
    subcategory: "بنتهاوس",
    price: 6200000,
    condition: "excellent",
    features: ["تراس", "إطلالة مارينا", "مطبخ ألماني", "غرفة خادمة"],
    featured: true,
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "محل تجاري — الفجيرة",
    titleEnglish: "Retail Shop — Fujairah",
    description:
      "محل على شارع رئيسي، واجهة زجاجية، مناسب لمطعم أو صالون أو بقالة.",
    descriptionEnglish:
      "Main-street shop with glass frontage — suitable for a café, salon, or grocery.",
    subcategory: "محلات",
    price: 75000,
    condition: "excellent",
    features: ["شارع رئيسي", "واجهة زجاجية", "موقف زبائن"],
  },
  {
    categoryId: "real-estate",
    imageCategory: "real-estate",
    title: "شقة استوديو مفروشة — أم القيوين",
    titleEnglish: "Furnished Studio — Umm Al Quwain",
    description:
      "استوديو هادئ ومفروش، إيجار اقتصادي، قريب من الخدمات الأساسية.",
    descriptionEnglish:
      "Quiet furnished studio at an affordable rent, close to essential services.",
    subcategory: "استوديو",
    price: 22000,
    condition: "excellent",
    features: ["مفروش", "هادئ", "قريب من الخدمات"],
  },

  // —— electronics (8)
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "بلايستيشن 5 + يدتين وألعاب",
    titleEnglish: "PlayStation 5 + 2 Controllers & Games",
    description:
      "PS5 بحالة ممتازة مع يدتين أصليتين و3 ألعاب، كرتونة كاملة.",
    descriptionEnglish:
      "Excellent PS5 with two original controllers and 3 games — full box.",
    subcategory: "ألعاب",
    price: 1650,
    condition: "excellent",
    features: ["يدتين", "3 ألعاب", "كرتونة"],
    featured: true,
  },
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "تلفزيون LG OLED 65 بوصة",
    titleEnglish: "LG OLED 65-inch TV",
    description:
      "شاشة OLED 4K، دعم Dolby Vision، حامل حائط مرفق، ضمان متبقي.",
    descriptionEnglish:
      "4K OLED with Dolby Vision, wall mount included, remaining warranty.",
    subcategory: "تلفزيونات",
    price: 4200,
    condition: "excellent",
    features: ["OLED", "4K", "Dolby Vision", "حامل حائط"],
  },
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "كاميرا Canon EOS R6",
    titleEnglish: "Canon EOS R6 Camera",
    description:
      "كاميرا احترافية مع عدسة 24-105، بطارية إضافية، حقيبة حماية.",
    descriptionEnglish:
      "Pro camera with 24-105 lens, spare battery, and protective bag.",
    subcategory: "كاميرات",
    price: 6800,
    condition: "excellent",
    features: ["عدسة 24-105", "بطارية إضافية", "حقيبة"],
  },
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "ساوند بار Bose 900",
    titleEnglish: "Bose Soundbar 900",
    description:
      "ساوند بار فاخر مع صوت محيطي، اتصال Wi-Fi وBluetooth، كالجديد.",
    descriptionEnglish:
      "Premium soundbar with surround sound, Wi-Fi and Bluetooth — like new.",
    subcategory: "صوتيات",
    price: 2100,
    condition: "excellent",
    features: ["محيطي", "Wi-Fi", "Bluetooth"],
  },
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "ماك بوك برو M3 14 إنش",
    titleEnglish: "MacBook Pro M3 14-inch",
    description:
      "ماك بوك برو M3، 16GB رام، 512GB، استخدام مكتبي خفيف جداً.",
    descriptionEnglish:
      "MacBook Pro M3, 16GB RAM, 512GB — very light office use.",
    subcategory: "لابتوبات",
    price: 6200,
    condition: "excellent",
    features: ["M3", "16GB", "512GB", "ضمان آبل"],
    featured: true,
  },
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "آيباد برو M4 مقاس 13",
    titleEnglish: "iPad Pro M4 13-inch",
    description:
      "آيباد برو مع قلم Apple Pencil، لوحة مفاتيح، غطاء أصلي.",
    descriptionEnglish:
      "iPad Pro with Apple Pencil, keyboard, and original case.",
    subcategory: "تابلت",
    price: 4800,
    condition: "new",
    features: ["M4", "Pencil", "Keyboard"],
  },
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "شاشة Dell UltraSharp 27",
    titleEnglish: "Dell UltraSharp 27 Monitor",
    description:
      "شاشة مكتبية QHD، ألوان دقيقة، منافذ USB-C وHDMI.",
    descriptionEnglish:
      "QHD office monitor with accurate colors, USB-C and HDMI ports.",
    subcategory: "شاشات",
    price: 1450,
    condition: "excellent",
    features: ["QHD", "USB-C", "HDMI"],
  },
  {
    categoryId: "electronics",
    imageCategory: "electronics",
    title: "طابعة ليزر HP متعددة الوظائف",
    titleEnglish: "HP Multifunction Laser Printer",
    description:
      "طابعة ليزر أبيض وأسود مع سكانر، مناسبة للمكاتب المنزلية.",
    descriptionEnglish:
      "B&W laser printer with scanner — ideal for home offices.",
    subcategory: "طابعات",
    price: 680,
    condition: "used",
    features: ["سكانر", "واي فاي", "توفير حبر"],
  },

  // —— mobiles (8)
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "آيفون 16 برو ماكس 256GB",
    titleEnglish: "iPhone 16 Pro Max 256GB",
    description:
      "آيفون 16 برو ماكس تيتانيوم، بطارية 98%، ضمان آبل ساري، كرتونة كاملة.",
    descriptionEnglish:
      "Titanium iPhone 16 Pro Max, 98% battery, active Apple warranty, full box.",
    subcategory: "آيفون",
    price: 4200,
    condition: "excellent",
    features: ["256GB", "تيتانيوم", "ضمان آبل"],
    featured: true,
  },
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "سامسونج S25 Ultra 512GB",
    titleEnglish: "Samsung Galaxy S25 Ultra 512GB",
    description:
      "S25 Ultra مع قلم S Pen، شاشة Dynamic AMOLED، حالة ممتازة.",
    descriptionEnglish:
      "S25 Ultra with S Pen and Dynamic AMOLED display in excellent condition.",
    subcategory: "سامسونج",
    price: 3900,
    condition: "excellent",
    features: ["S Pen", "512GB", "كاميرا 200MP"],
  },
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "آيفون 15 برو 128GB",
    titleEnglish: "iPhone 15 Pro 128GB",
    description:
      "آيفون 15 برو بحالة ممتازة، شاشة بدون خدوش، شاحن أصلي.",
    descriptionEnglish:
      "Excellent iPhone 15 Pro, scratch-free screen, original charger.",
    subcategory: "آيفون",
    price: 2800,
    condition: "excellent",
    features: ["128GB", "شاحن أصلي", "Face ID"],
  },
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "جوجل بكسل 8 برو",
    titleEnglish: "Google Pixel 8 Pro",
    description:
      "بكسل 8 برو للتصوير الاحترافي، تحديثات أندرويد طويلة الأمد.",
    descriptionEnglish:
      "Pixel 8 Pro for pro photography with long-term Android updates.",
    subcategory: "جوجل",
    price: 2100,
    condition: "excellent",
    features: ["كاميرا AI", "تحديثات طويلة"],
  },
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "آبل واتش Ultra 2",
    titleEnglish: "Apple Watch Ultra 2",
    description:
      "ساعة Ultra 2 مع حزام تيتانيوم، مثالية للرياضة والغوص.",
    descriptionEnglish:
      "Ultra 2 with titanium band — ideal for sport and diving.",
    subcategory: "ساعات ذكية",
    price: 2650,
    condition: "new",
    features: ["GPS", "مقاومة ماء", "بطارية طويلة"],
    featured: true,
  },
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "شاومي 14 Ultra",
    titleEnglish: "Xiaomi 14 Ultra",
    description:
      "شاومي 14 Ultra بكاميرا Leica، شحن سريع 90W، صندوق كامل.",
    descriptionEnglish:
      "Xiaomi 14 Ultra with Leica camera and 90W fast charging — full box.",
    subcategory: "شاومي",
    price: 3200,
    condition: "excellent",
    features: ["Leica", "90W", "صندوق كامل"],
  },
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "آيفون 14 128GB أزرق",
    titleEnglish: "iPhone 14 128GB Blue",
    description:
      "آيفون 14 نظيف جداً، بطارية جيدة، مناسب كجهاز يومي موثوق.",
    descriptionEnglish:
      "Very clean iPhone 14 with good battery — reliable daily driver.",
    subcategory: "آيفون",
    price: 1850,
    condition: "used",
    features: ["128GB", "بطارية جيدة"],
  },
  {
    categoryId: "mobiles",
    imageCategory: "mobiles",
    title: "سماعات AirPods Pro 2",
    titleEnglish: "AirPods Pro 2",
    description:
      "إيربودز برو 2 مع علبة MagSafe، إلغاء ضوضاء ممتاز.",
    descriptionEnglish:
      "AirPods Pro 2 with MagSafe case and excellent noise cancellation.",
    subcategory: "إكسسوارات",
    price: 720,
    condition: "excellent",
    features: ["ANC", "MagSafe", "صوت مكاني"],
  },

  // —— furniture (8)
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "طقم كنب إيطالي 7 قطع",
    titleEnglish: "Italian 7-Seater Sofa Set",
    description:
      "طقم كنب جلد إيطالي فاخر، لون بيج، حالة ممتازة بدون بقع.",
    descriptionEnglish:
      "Premium Italian leather sofa set in beige — excellent, stain-free condition.",
    subcategory: "كنب",
    price: 8500,
    condition: "excellent",
    features: ["جلد إيطالي", "7 مقاعد", "بدون بقع"],
    featured: true,
  },
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "طاولة طعام 8 أشخاص",
    titleEnglish: "8-Seater Dining Table",
    description:
      "طاولة خشب سنديان مع 8 كراسي مبطنة، تصميم عصري.",
    descriptionEnglish:
      "Oak dining table with 8 upholstered chairs — modern design.",
    subcategory: "طاولات طعام",
    price: 4200,
    condition: "excellent",
    features: ["خشب سنديان", "8 كراسي"],
  },
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "غرفة نوم ماستر كينج",
    titleEnglish: "King Master Bedroom Set",
    description:
      "طقم غرفة نوم كينج: سرير، دولاب، تسريحة، طاولتي جانبية.",
    descriptionEnglish:
      "King bedroom set: bed, wardrobe, dresser, and two nightstands.",
    subcategory: "غرف نوم",
    price: 9800,
    condition: "excellent",
    features: ["كينج", "دولاب", "تسريحة"],
  },
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "مكتب تنفيذي خشبي",
    titleEnglish: "Executive Wooden Desk",
    description:
      "مكتب تنفيذي مع أدراج وقفل، مناسب للمكاتب المنزلية والشركات.",
    descriptionEnglish:
      "Executive desk with lockable drawers — suitable for home and office.",
    subcategory: "مكاتب",
    price: 2100,
    condition: "excellent",
    features: ["أدراج", "قفل", "خشب"],
  },
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "طقم حديقة خارجي فاخر",
    titleEnglish: "Premium Outdoor Garden Set",
    description:
      "طقم جلوس خارجي مقاوم للشمس والرطوبة، مع طاولة وسطية.",
    descriptionEnglish:
      "Sun- and moisture-resistant outdoor seating set with coffee table.",
    subcategory: "خارجي",
    price: 3600,
    condition: "new",
    features: ["مقاوم للشمس", "طاولة وسط"],
  },
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "خزانة ملابس 6 أبواب",
    titleEnglish: "6-Door Wardrobe",
    description:
      "خزانة واسعة مع مرايا منزلقة وأرفف داخلية منظمة.",
    descriptionEnglish:
      "Spacious wardrobe with sliding mirrors and organized interior shelves.",
    subcategory: "خزائن",
    price: 2900,
    condition: "excellent",
    features: ["مرايا منزلقة", "أرفف"],
  },
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "سرير أطفال مع أدراج",
    titleEnglish: "Kids Bed with Drawers",
    description:
      "سرير أطفال عملي مع مساحة تخزين سفلية، خشب آمن.",
    descriptionEnglish:
      "Practical kids bed with under-storage drawers — safe wood.",
    subcategory: "أطفال",
    price: 950,
    condition: "excellent",
    features: ["تخزين", "خشب آمن"],
  },
  {
    categoryId: "furniture",
    imageCategory: "furniture",
    title: "ركن قهوة مودرن",
    titleEnglish: "Modern Coffee Corner Set",
    description:
      "كنبة زاوية مع طاولة قهوة زجاجية، مثالية للشقق الصغيرة.",
    descriptionEnglish:
      "Corner sofa with glass coffee table — perfect for compact apartments.",
    subcategory: "كنب",
    price: 3200,
    condition: "excellent",
    features: ["زاوية", "طاولة زجاج"],
  },

  // —— jobs (8)
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "مندوب مبيعات — دوام كامل",
    titleEnglish: "Sales Executive — Full Time",
    description:
      "مطلوب مندوب مبيعات خبرة سنتين فأكثر، راتب أساسي + عمولة، تأمين صحي.",
    descriptionEnglish:
      "Sales executive wanted (2+ years). Base salary + commission and health insurance.",
    subcategory: "مبيعات",
    price: 6500,
    condition: "new",
    features: ["عمولة", "تأمين صحي", "دوام كامل"],
    featured: true,
  },
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "وسيط عقاري — أبوظبي",
    titleEnglish: "Real Estate Agent — Abu Dhabi",
    description:
      "فرصة لوسيط عقاري مرخص، عمولات عالية، دعم تسويقي كامل.",
    descriptionEnglish:
      "Opportunity for a licensed agent with high commissions and full marketing support.",
    subcategory: "عقارات",
    price: 8000,
    condition: "new",
    features: ["عمولات عالية", "دعم تسويقي"],
  },
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "سائق توصيل — الشارقة",
    titleEnglish: "Delivery Driver — Sharjah",
    description:
      "سائق توصيل برخصة خفيفة، دوام مرن، بدل وقود، راتب شهري ثابت.",
    descriptionEnglish:
      "Delivery driver with light license, flexible hours, fuel allowance, fixed monthly pay.",
    subcategory: "سائقين",
    price: 3500,
    condition: "new",
    features: ["بدل وقود", "دوام مرن"],
  },
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "محاسب — الفجيرة",
    titleEnglish: "Accountant — Fujairah",
    description:
      "مطلوب محاسب خبرة في الضرائب والرواتب، إجادة Excel، دوام مكتبي.",
    descriptionEnglish:
      "Accountant needed with tax/payroll experience, strong Excel, office-based.",
    subcategory: "محاسبة",
    price: 7000,
    condition: "new",
    features: ["ضرائب", "رواتب", "Excel"],
  },
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "مصمم جرافيك — دبي",
    titleEnglish: "Graphic Designer — Dubai",
    description:
      "مصمم جرافيك محترف لفريق تسويق، Adobe Suite، عمل هجين ممكن.",
    descriptionEnglish:
      "Pro graphic designer for marketing team, Adobe Suite, hybrid work possible.",
    subcategory: "تصميم",
    price: 7500,
    condition: "new",
    features: ["Adobe", "هجين", "مشاريع رقمية"],
  },
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "ممرض/ة عيادة خاصة",
    titleEnglish: "Clinic Nurse",
    description:
      "مطلوب ممرض/ة بترخيص وزارة الصحة، دوام صباحي، راتب مجزي.",
    descriptionEnglish:
      "MOH-licensed nurse wanted for morning shifts with competitive pay.",
    subcategory: "رعاية صحية",
    price: 9000,
    condition: "new",
    features: ["ترخيص وزارة الصحة", "دوام صباحي"],
  },
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "مهندس موقع — رأس الخيمة",
    titleEnglish: "Site Engineer — Ras Al Khaimah",
    description:
      "مهندس مدني لمشروع سكني، خبرة مواقع، سيارة عمل موفرة.",
    descriptionEnglish:
      "Civil site engineer for a residential project; company vehicle provided.",
    subcategory: "هندسة",
    price: 11000,
    condition: "new",
    features: ["سيارة عمل", "مشروع سكني"],
  },
  {
    categoryId: "jobs",
    imageCategory: "jobs",
    title: "موظف استقبال فندقي",
    titleEnglish: "Hotel Front Desk Agent",
    description:
      "استقبال فندق 4 نجوم، لغة إنجليزية ممتازة، ورديات متناوبة.",
    descriptionEnglish:
      "4-star hotel front desk role requiring excellent English and rotating shifts.",
    subcategory: "ضيافة",
    price: 4500,
    condition: "new",
    features: ["إنجليزية", "ورديات", "تأمين"],
  },

  // —— fashion (8)
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "رولكس سابمارينر ديت",
    titleEnglish: "Rolex Submariner Date",
    description:
      "ساعة رولكس أصلية مع أوراق الضمان والصندوق، فحص متوفر عند المعاينة.",
    descriptionEnglish:
      "Authentic Rolex with papers and box — inspection available on viewing.",
    subcategory: "ساعات",
    price: 52000,
    condition: "excellent",
    features: ["أصلية", "صندوق وأوراق", "فحص"],
    featured: true,
  },
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "حقيبة Louis Vuitton Neverfull",
    titleEnglish: "Louis Vuitton Neverfull MM",
    description:
      "حقيبة LV Neverfull MM بحالة ممتازة، إكسسوارات أصلية كاملة.",
    descriptionEnglish:
      "LV Neverfull MM in excellent condition with full original accessories.",
    subcategory: "حقائب",
    price: 6800,
    condition: "excellent",
    features: ["أصلية", "إكسسوارات كاملة"],
  },
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "عباية مصممة إصدار محدود",
    titleEnglish: "Limited Edition Designer Abaya",
    description:
      "عباية فاخرة بتطريز يدوي، مقاس متوسط، لُبست مرة واحدة فقط.",
    descriptionEnglish:
      "Luxury hand-embroidered abaya, medium size, worn once only.",
    subcategory: "عبايات",
    price: 1200,
    condition: "excellent",
    features: ["تطريز يدوي", "مقاس متوسط"],
  },
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "طقم عود عربي فاخر",
    titleEnglish: "Premium Arabic Oud Gift Set",
    description:
      "طقم عود ومبخرة وهدايا، تغليف فاخر مناسب للمناسبات.",
    descriptionEnglish:
      "Oud, burner, and gifts in premium packaging — ideal for occasions.",
    subcategory: "عطور",
    price: 450,
    condition: "new",
    features: ["تغليف فاخر", "مبخرة"],
  },
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "حذاء رياضي Nike Air Max",
    titleEnglish: "Nike Air Max Sneakers",
    description:
      "حذاء Nike أصلي مقاس 43، استخدام خفيف جداً، علبة كاملة.",
    descriptionEnglish:
      "Original Nike size 43, lightly used, full box.",
    subcategory: "أحذية",
    price: 380,
    condition: "excellent",
    features: ["مقاس 43", "علبة"],
  },
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "نظارة Ray-Ban أصلية",
    titleEnglish: "Authentic Ray-Ban Sunglasses",
    description:
      "نظارة شمسية Ray-Ban مع علبة وقماش تنظيف، حماية UV.",
    descriptionEnglish:
      "Ray-Ban sunglasses with case and cleaning cloth — UV protection.",
    subcategory: "نظارات",
    price: 520,
    condition: "excellent",
    features: ["UV", "علبة"],
  },
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "طقم ذهب عيار 21 — خاتم وأقراط",
    titleEnglish: "21K Gold Set — Ring & Earrings",
    description:
      "طقم ذهب عيار 21 مع فاتورة محل معتمد، وزن تقريبي موضح عند المعاينة.",
    descriptionEnglish:
      "21K gold set with certified shop invoice; approximate weight shown on viewing.",
    subcategory: "مجوهرات",
    price: 8900,
    condition: "new",
    features: ["عيار 21", "فاتورة"],
  },
  {
    categoryId: "fashion",
    imageCategory: "fashion",
    title: "ساعة كاسيو إديفيس رجالية",
    titleEnglish: "Casio Edifice Men's Watch",
    description:
      "ساعة كاسيو أنيقة مقاومة للماء، بطارية جديدة، مناسبة للعمل.",
    descriptionEnglish:
      "Elegant water-resistant Casio with new battery — suitable for work.",
    subcategory: "ساعات",
    price: 420,
    condition: "excellent",
    features: ["مقاومة ماء", "بطارية جديدة"],
  },

  // —— services (8)
  {
    categoryId: "services",
    imageCategory: "services",
    title: "خدمة تنظيف منازل احترافية",
    titleEnglish: "Professional Home Cleaning",
    description:
      "فريق تنظيف مدرب، مواد آمنة، حجوزات يومية وأسبوعية في كل الإمارات.",
    descriptionEnglish:
      "Trained cleaning team, safe products, daily and weekly bookings across the UAE.",
    subcategory: "تنظيف",
    price: 180,
    condition: "new",
    features: ["مواد آمنة", "حجز مرن", "تأمين"],
    featured: true,
  },
  {
    categoryId: "services",
    imageCategory: "services",
    title: "صيانة فلل ومكيفات",
    titleEnglish: "Villa & AC Maintenance",
    description:
      "صيانة دورية للمكيفات والسباكة والكهرباء، فنيون مرخصون.",
    descriptionEnglish:
      "Scheduled AC, plumbing, and electrical maintenance by licensed technicians.",
    subcategory: "صيانة",
    price: 250,
    condition: "new",
    features: ["مكيفات", "سباكة", "كهرباء"],
  },
  {
    categoryId: "services",
    imageCategory: "services",
    title: "تلميع سيارات فاخر",
    titleEnglish: "Premium Car Detailing",
    description:
      "تلميع داخلي وخارجي، حماية سيراميك، خدمة منزلية متوفرة.",
    descriptionEnglish:
      "Interior/exterior detailing with ceramic protection; mobile service available.",
    subcategory: "سيارات",
    price: 350,
    condition: "new",
    features: ["سيراميك", "خدمة منزلية"],
  },
  {
    categoryId: "services",
    imageCategory: "services",
    title: "نقل عفش داخل الإمارات",
    titleEnglish: "UAE Moving Service",
    description:
      "نقل عفش مع فك وتركيب، تغليف احترافي، تأمين على المنقولات.",
    descriptionEnglish:
      "Moving with dismantling/assembly, professional packing, and cargo insurance.",
    subcategory: "نقل",
    price: 600,
    condition: "new",
    features: ["فك وتركيب", "تأمين", "تغليف"],
  },
  {
    categoryId: "services",
    imageCategory: "services",
    title: "إصلاح مكيفات طارئ 24/7",
    titleEnglish: "24/7 Emergency AC Repair",
    description:
      "استجابة سريعة لأعطال التبريد، قطع غيار أصلية، ضمان على الإصلاح.",
    descriptionEnglish:
      "Fast response for cooling failures, genuine parts, repair warranty.",
    subcategory: "تكييف",
    price: 200,
    condition: "new",
    features: ["24/7", "قطع أصلية", "ضمان"],
  },
  {
    categoryId: "services",
    imageCategory: "services",
    title: "تصوير احترافي للعقارات",
    titleEnglish: "Professional Property Photography",
    description:
      "تصوير عقاري بكاميرات احترافية وطائرة درون، تسليم خلال 24 ساعة.",
    descriptionEnglish:
      "Property photography with pro cameras and drone — delivery within 24 hours.",
    subcategory: "تصوير",
    price: 450,
    condition: "new",
    features: ["درون", "تسليم سريع"],
  },
  {
    categoryId: "services",
    imageCategory: "services",
    title: "تدريب شخصي في المنزل",
    titleEnglish: "In-Home Personal Training",
    description:
      "مدرب معتمد، برامج تخسيس وبناء عضل، جلسات فردية في منزلك.",
    descriptionEnglish:
      "Certified trainer for weight loss and muscle building — private home sessions.",
    subcategory: "لياقة",
    price: 300,
    condition: "new",
    features: ["معتمد", "جلسات فردية"],
  },
  {
    categoryId: "services",
    imageCategory: "services",
    title: "استشارات قانونية عقارية",
    titleEnglish: "Real Estate Legal Consulting",
    description:
      "مراجعة عقود الإيجار والبيع، استشارة أولية، محامٍ مرخص.",
    descriptionEnglish:
      "Lease and sale contract review with an initial consult — licensed lawyer.",
    subcategory: "قانون",
    price: 500,
    condition: "new",
    features: ["محامٍ مرخص", "عقود"],
  },

  // —— pets (6)
  {
    categoryId: "pets",
    imageCategory: "pets",
    title: "جولدن ريتريفر مطعم — دبي",
    titleEnglish: "Vaccinated Golden Retriever — Dubai",
    description:
      "جرو جولدن مطعم ومفحوص بيطرياً، أوراق كاملة، مناسب للعوائل.",
    descriptionEnglish:
      "Vaccinated, vet-checked Golden puppy with full papers — family friendly.",
    subcategory: "كلاب",
    price: 4500,
    condition: "new",
    features: ["مطعم", "أوراق", "فحص بيطري"],
    featured: true,
  },
  {
    categoryId: "pets",
    imageCategory: "pets",
    title: "قطة فارسية — الشارقة",
    titleEnglish: "Persian Cat — Sharjah",
    description:
      "قطة فارسية هادئة، مدربة على الصندوق، مع أغراضها الأساسية.",
    descriptionEnglish:
      "Calm Persian cat, litter-trained, with basic supplies included.",
    subcategory: "قطط",
    price: 1800,
    condition: "excellent",
    features: ["صندوق", "هادئة", "أغراض"],
  },
  {
    categoryId: "pets",
    imageCategory: "pets",
    title: "حوض أسماك بحري كامل التجهيز",
    titleEnglish: "Complete Marine Aquarium Setup",
    description:
      "حوض بحري مع فلتر وإضاءة وأسماك، جاهز للتشغيل فوراً.",
    descriptionEnglish:
      "Marine tank with filter, lighting, and fish — ready to run.",
    subcategory: "أسماك",
    price: 2200,
    condition: "excellent",
    features: ["فلتر", "إضاءة", "أسماك"],
  },
  {
    categoryId: "pets",
    imageCategory: "pets",
    title: "زوج بادجي ألوان مميزة",
    titleEnglish: "Colorful Budgie Pair",
    description:
      "زوج بادجي بصحة ممتازة مع قفص كبير وطعام أسبوعي.",
    descriptionEnglish:
      "Healthy budgie pair with large cage and a week of food.",
    subcategory: "طيور",
    price: 280,
    condition: "excellent",
    features: ["قفص", "طعام"],
  },
  {
    categoryId: "pets",
    imageCategory: "pets",
    title: "أقفاص وحمالات قطط للبيع",
    titleEnglish: "Cat Carriers & Cages for Sale",
    description:
      "مجموعة حمالات وأقفاص بحالة جيدة، مناسبة للسفر والعيادة.",
    descriptionEnglish:
      "Set of carriers and cages in good condition — travel and clinic ready.",
    subcategory: "مستلزمات",
    price: 150,
    condition: "used",
    features: ["سفر", "عيادة"],
  },
  {
    categoryId: "pets",
    imageCategory: "pets",
    title: "أرنب هولندي أليف",
    titleEnglish: "Friendly Dutch Rabbit",
    description:
      "أرنب أليف مع قفص وطعام، مثالي للأطفال تحت إشراف.",
    descriptionEnglish:
      "Friendly rabbit with cage and food — great for supervised kids.",
    subcategory: "حيوانات أليفة",
    price: 320,
    condition: "excellent",
    features: ["قفص", "طعام"],
  },

  // —— kids (6)
  {
    categoryId: "kids",
    imageCategory: "kids",
    title: "عربة أطفال فاخرة قابلة للطي",
    titleEnglish: "Premium Foldable Stroller",
    description:
      "عربة أطفال خفيفة قابلة للطي بيد واحدة، مناسبة للسفر والمولات.",
    descriptionEnglish:
      "Lightweight one-hand fold stroller — ideal for travel and malls.",
    subcategory: "عربات",
    price: 650,
    condition: "excellent",
    features: ["طي بيد واحدة", "خفيفة"],
  },
  {
    categoryId: "kids",
    imageCategory: "kids",
    title: "سرير أطفال خشبي آمن",
    titleEnglish: "Safe Wooden Baby Crib",
    description:
      "سرير أطفال بمعايير أمان، مرتبة طبية مرفقة، حالة ممتازة.",
    descriptionEnglish:
      "Safety-standard crib with medical mattress included — excellent condition.",
    subcategory: "أثاث أطفال",
    price: 780,
    condition: "excellent",
    features: ["معايير أمان", "مرتبة"],
  },
  {
    categoryId: "kids",
    imageCategory: "kids",
    title: "مجموعة ألعاب تعليمية",
    titleEnglish: "Educational Toys Bundle",
    description:
      "ألعاب تعليمية للأعمار 3–7، نظيفة ومعقمة، صندوق كبير.",
    descriptionEnglish:
      "Educational toys for ages 3–7, cleaned and sanitized, large box.",
    subcategory: "ألعاب",
    price: 220,
    condition: "excellent",
    features: ["تعليمية", "معقمة"],
  },
  {
    categoryId: "kids",
    imageCategory: "kids",
    title: "كرسي سيارة أطفال معتمد",
    titleEnglish: "Certified Child Car Seat",
    description:
      "كرسي سيارة بمعايير ECE، مناسب من عمر سنة إلى 4 سنوات.",
    descriptionEnglish:
      "ECE-certified car seat suitable from age 1 to 4.",
    subcategory: "سلامة",
    price: 420,
    condition: "excellent",
    features: ["ECE", "مقاس عمري"],
  },
  {
    categoryId: "kids",
    imageCategory: "kids",
    title: "دراجة أطفال 16 إنش",
    titleEnglish: "16-inch Kids Bicycle",
    description:
      "دراجة أطفال مع عجلات مساعدة قابلة للإزالة، خوذة مرفقة.",
    descriptionEnglish:
      "Kids bike with removable training wheels; helmet included.",
    subcategory: "دراجات",
    price: 290,
    condition: "excellent",
    features: ["عجلات مساعدة", "خوذة"],
  },
  {
    categoryId: "kids",
    imageCategory: "kids",
    title: "ملابس أطفال ماركات — طقم",
    titleEnglish: "Branded Kids Clothes Bundle",
    description:
      "طقم ملابس أطفال ماركات عالمية، مقاسات متعددة، حالة ممتازة.",
    descriptionEnglish:
      "Bundle of branded kids clothes in multiple sizes — excellent condition.",
    subcategory: "ملابس",
    price: 180,
    condition: "excellent",
    features: ["ماركات", "مقاسات متعددة"],
  },

  // —— books (5)
  {
    categoryId: "books",
    imageCategory: "books",
    title: "مجموعة روايات عربية كلاسيكية",
    titleEnglish: "Classic Arabic Novels Collection",
    description:
      "مجموعة 12 رواية عربية بحالة ممتازة، مناسبة للهواة والمكتبات المنزلية.",
    descriptionEnglish:
      "Set of 12 Arabic novels in excellent condition — ideal for home libraries.",
    subcategory: "روايات",
    price: 180,
    condition: "excellent",
    features: ["12 كتاب", "حالة ممتازة"],
  },
  {
    categoryId: "books",
    imageCategory: "books",
    title: "كتب تطوير ذات وإنتاجية",
    titleEnglish: "Self-Development & Productivity Books",
    description:
      "مجموعة كتب إنجليزية وعربية في القيادة وإدارة الوقت.",
    descriptionEnglish:
      "Arabic and English set on leadership and time management.",
    subcategory: "تطوير ذات",
    price: 240,
    condition: "excellent",
    features: ["ثنائي اللغة", "قيادة"],
  },
  {
    categoryId: "books",
    imageCategory: "books",
    title: "مناهج دراسية للمرحلة الثانوية",
    titleEnglish: "Secondary School Curricula",
    description:
      "كتب مناهج حديثة بحالة جيدة، مناسبة للطلاب والمدرسين الخصوصيين.",
    descriptionEnglish:
      "Recent curriculum books in good condition — for students and tutors.",
    subcategory: "مناهج",
    price: 120,
    condition: "used",
    features: ["ثانوية", "حالة جيدة"],
  },
  {
    categoryId: "books",
    imageCategory: "books",
    title: "أطلس الإمارات المصور",
    titleEnglish: "Illustrated UAE Atlas",
    description:
      "أطلس مصور عن الإمارات والمدن والمعالم، طبعة حديثة.",
    descriptionEnglish:
      "Illustrated atlas of the UAE, cities, and landmarks — recent edition.",
    subcategory: "مراجع",
    price: 95,
    condition: "new",
    features: ["مصور", "طبعة حديثة"],
  },
  {
    categoryId: "books",
    imageCategory: "books",
    title: "كتب أطفال مصورة — صندوق",
    titleEnglish: "Illustrated Kids Books Box",
    description:
      "صندوق كتب أطفال ملونة بالعربية والإنجليزية، أعمار 4–8.",
    descriptionEnglish:
      "Box of colorful Arabic/English kids books for ages 4–8.",
    subcategory: "أطفال",
    price: 110,
    condition: "excellent",
    features: ["ثنائي اللغة", "ملونة"],
  },

  // —— sports (6)
  {
    categoryId: "sports",
    imageCategory: "sports",
    title: "جهاز مشي كهربائي منزلي",
    titleEnglish: "Home Electric Treadmill",
    description:
      "جهاز مشي قابل للطي، شاشة رقمية، استخدام منزلي خفيف.",
    descriptionEnglish:
      "Foldable treadmill with digital display — light home use.",
    subcategory: "لياقة",
    price: 1600,
    condition: "excellent",
    features: ["قابل للطي", "شاشة"],
    featured: true,
  },
  {
    categoryId: "sports",
    imageCategory: "sports",
    title: "أوزان دامبل قابلة للتعديل",
    titleEnglish: "Adjustable Dumbbell Set",
    description:
      "طقم دامبل من 2 إلى 24 كجم لكل يد، موفّر للمساحة.",
    descriptionEnglish:
      "Adjustable dumbbells from 2 to 24 kg per hand — space-saving.",
    subcategory: "أوزان",
    price: 980,
    condition: "excellent",
    features: ["قابل للتعديل", "موفّر مساحة"],
  },
  {
    categoryId: "sports",
    imageCategory: "sports",
    title: "دراجة هوائية جبلية",
    titleEnglish: "Mountain Bike",
    description:
      "دراجة جبلية 27.5، فرامل قرصية، جاهزة للطرق الوعرة.",
    descriptionEnglish:
      "27.5 mountain bike with disc brakes — ready for rough trails.",
    subcategory: "دراجات",
    price: 1450,
    condition: "excellent",
    features: ["فرامل قرصية", "27.5"],
  },
  {
    categoryId: "sports",
    imageCategory: "sports",
    title: "طقم غوص كامل",
    titleEnglish: "Complete Diving Kit",
    description:
      "بدلة ونظارات وزعانف ومنظم، مناسب لمياه الخليج.",
    descriptionEnglish:
      "Wetsuit, mask, fins, and regulator — suitable for Gulf waters.",
    subcategory: "غوص",
    price: 2200,
    condition: "excellent",
    features: ["بدلة", "منظم", "زعانف"],
  },
  {
    categoryId: "sports",
    imageCategory: "sports",
    title: "مضارب تنس Wilson + كرات",
    titleEnglish: "Wilson Tennis Rackets + Balls",
    description:
      "مضربان Wilson مع حقيبة وعلبة كرات، استخدام نوادي.",
    descriptionEnglish:
      "Two Wilson rackets with bag and ball can — club use.",
    subcategory: "تنس",
    price: 380,
    condition: "excellent",
    features: ["مضربان", "حقيبة"],
  },
  {
    categoryId: "sports",
    imageCategory: "sports",
    title: "سجادة يوغا احترافية + بلوكات",
    titleEnglish: "Pro Yoga Mat + Blocks",
    description:
      "سجادة مانعة للانزلاق مع بلوكين وحزام تمدد، كالجديدة.",
    descriptionEnglish:
      "Non-slip mat with two blocks and a stretch strap — like new.",
    subcategory: "يوغا",
    price: 160,
    condition: "new",
    features: ["مانعة انزلاق", "بلوكات"],
  },

  // —— food (5)
  {
    categoryId: "food",
    imageCategory: "food",
    title: "تمور خلاص فاخرة — صندوق 5 كجم",
    titleEnglish: "Premium Khalas Dates — 5kg Box",
    description:
      "تمور خلاص إماراتية فاخرة، تغليف هدايا، توصيل داخل الإمارة متاح.",
    descriptionEnglish:
      "Premium Emirati Khalas dates in gift packaging; local delivery available.",
    subcategory: "تمور",
    price: 180,
    condition: "new",
    features: ["5 كجم", "تغليف هدايا"],
    featured: true,
  },
  {
    categoryId: "food",
    imageCategory: "food",
    title: "عسل سدر جبلي طبيعي",
    titleEnglish: "Natural Mountain Sidr Honey",
    description:
      "عسل سدر طبيعي 1 كجم، بدون إضافات، مختبر ومعبأ حديثاً.",
    descriptionEnglish:
      "1kg natural Sidr honey with no additives — lab-checked and freshly packed.",
    subcategory: "عسل",
    price: 220,
    condition: "new",
    features: ["طبيعي", "1 كجم"],
  },
  {
    categoryId: "food",
    imageCategory: "food",
    title: "قهوة عربية محمصة طازجة",
    titleEnglish: "Freshly Roasted Arabic Coffee",
    description:
      "بن عربي محمص يومياً، عبوة 500غ، مناسب للمجالس والهدايا.",
    descriptionEnglish:
      "Daily-roasted Arabic coffee, 500g pack — ideal for majlis and gifts.",
    subcategory: "قهوة",
    price: 75,
    condition: "new",
    features: ["تحميص يومي", "500غ"],
  },
  {
    categoryId: "food",
    imageCategory: "food",
    title: "حلويات إماراتية مشكلة",
    titleEnglish: "Assorted Emirati Sweets",
    description:
      "صينية حلويات طازجة (لقيمات، خبيص، محلى)، طلب مسبق قبل 24 ساعة.",
    descriptionEnglish:
      "Fresh sweets tray (luqaimat, khabees, and more) — order 24 hours ahead.",
    subcategory: "حلويات",
    price: 140,
    condition: "new",
    features: ["طازج", "طلب مسبق"],
  },
  {
    categoryId: "food",
    imageCategory: "food",
    title: "زيوت زيتون بكر فاخرة",
    titleEnglish: "Premium Extra Virgin Olive Oil",
    description:
      "زيت زيتون بكر ممتاز 2 لتر، معصور على البارد، للاستخدام المنزلي.",
    descriptionEnglish:
      "2L cold-pressed extra virgin olive oil for home use.",
    subcategory: "زيوت",
    price: 95,
    condition: "new",
    features: ["بكر", "2 لتر"],
  },
];

const TONES: ListingImageTone[] = ["gold", "amber", "sky", "rose", "slate"];

function padId(index: number): string {
  return `live-mkt-${String(index + 1).padStart(3, "0")}`;
}

function slugify(titleEnglish: string, index: number): string {
  const base = titleEnglish
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base}-${String(index + 1).padStart(3, "0")}`;
}

function buildCategorySpecs(def: SeedDef): Record<string, string> {
  const text = `${def.titleEnglish} ${def.title} ${def.subcategory}`;
  const brand = detectBrandFromText(def.categoryId, text);
  const model = detectModelFromText(def.categoryId, brand, text);
  const specs: Record<string, string> = {};

  if (brand) specs.brand = brand;
  if (model) specs.model = model;

  if (def.categoryId === "cars") {
    const yearMatch = def.titleEnglish.match(/\b(20\d{2}|19\d{2})\b/);
    specs.year = yearMatch?.[1] ?? String(2018 + (def.title.length % 7));
    specs.transmission = /يدوي|Manual/i.test(text) ? "يدوي" : "أوتوماتيك";
    specs.fuelType = /Tesla|كهرب|Electric/i.test(text) ? "كهرباء" : "بنزين";
    specs.mileage = String(12000 + (def.price % 90000));
    specs.regionalSpecs =
      /مستورد|US Spec|American|European|imported/i.test(text)
        ? "مستورد"
        : "خليجي";
  }

  if (def.categoryId === "mobiles") {
    specs.storage =
      /512|Ultra|Pro Max/i.test(def.titleEnglish) ? "512GB" :
      /256|Pro/i.test(def.titleEnglish) ? "256GB" :
      "128GB";
    specs.condition = def.condition;
  }

  if (def.categoryId === "electronics" && brand) {
    specs.condition = def.condition;
  }

  if (def.categoryId === "real-estate") {
    if (/فيلا|Villa|دوبلكس|Duplex/i.test(text)) specs.propertyType = "فيلا";
    else if (/بنتهاوس|Penthouse/i.test(text)) specs.propertyType = "بنتهاوس";
    else if (/تاون|Townhouse/i.test(text)) specs.propertyType = "تاون هاوس";
    else if (/مكتب|Office/i.test(text)) specs.propertyType = "مكتب";
    else if (/محل|Shop|Retail/i.test(text)) specs.propertyType = "محل";
    else if (/أرض|Plot/i.test(text)) specs.propertyType = "أرض";
    else if (/استوديو|Studio/i.test(text)) specs.propertyType = "استوديو";
    else specs.propertyType = "شقة";

    specs.purpose = /للإيجار|rent|إيجار/i.test(text) || def.price < 200000
      ? "للإيجار"
      : "للبيع";

    if (/5|خمس/i.test(text)) specs.bedrooms = "5";
    else if (/4|أربع/i.test(text)) specs.bedrooms = "4";
    else if (/3|ثلاث/i.test(text)) specs.bedrooms = "3";
    else if (/2|غرفتين|2BR/i.test(text)) specs.bedrooms = "2";
    else if (/1|غرفة وصالة|1BR/i.test(text)) specs.bedrooms = "1";
    else if (/استوديو|Studio/i.test(text)) specs.bedrooms = "0";
    else specs.bedrooms = "2";

    specs.area = String(600 + (def.price % 4000));
  }

  if (def.categoryId === "fashion" && brand) {
    specs.brand = brand;
  }

  return specs;
}

function buildListing(def: SeedDef, index: number): Listing {
  const emiratePack = EMIRATES[index % EMIRATES.length];
  const area = emiratePack.areas[index % emiratePack.areas.length];
  const seller = SELLERS[index % SELLERS.length];
  const images = galleryForListingProduct({
    categoryId: def.categoryId,
    count: 4,
    imageCategory: def.imageCategory,
    seed: `${def.categoryId}-${index}`,
    title: def.title,
    titleEnglish: def.titleEnglish,
  });
  const postedDay = 10 + (index % 20);
  const postedAt = `2026-08-${String(postedDay).padStart(2, "0")}T10:00:00+04:00`;
  const featuredUntil = def.featured
    ? "2026-12-31T23:59:59+04:00"
    : undefined;
  const categorySpecs = buildCategorySpecs(def);

  return {
    id: padId(index),
    slug: slugify(def.titleEnglish, index),
    title: def.title,
    titleEnglish: def.titleEnglish,
    description: def.description,
    descriptionEnglish: def.descriptionEnglish,
    categoryId: def.categoryId,
    subcategory: def.subcategory,
    city: emiratePack.emirate,
    emirate: emiratePack.emirate,
    area,
    country: "الإمارات العربية المتحدة",
    price: def.price,
    currency: "AED",
    condition: def.condition,
    status: "active",
    isFeatured: Boolean(def.featured),
    featuredUntil,
    isPremium: Boolean(def.featured),
    views: 120 + ((index * 37) % 2400),
    images,
    imageUrl: images[0],
    seller: { ...seller },
    verifiedSeller: true,
    escrowAvailable: def.categoryId === "cars" || def.categoryId === "real-estate",
    postedAt,
    expiresAt: "2026-12-31T23:59:59+04:00",
    contactMethod: "both",
    contactPhone: `9715${String(10000000 + index).slice(0, 8)}`,
    deliveryOption:
      def.categoryId === "jobs" || def.categoryId === "real-estate"
        ? "not_applicable"
        : def.categoryId === "services"
          ? "both"
          : "pickup",
    imageTone: TONES[index % TONES.length],
    features: def.features,
    negotiable: def.price > 1000,
    categorySpecs,
    source: LIVE_MARKETPLACE_SOURCE,
  };
}

let cached: Listing[] | null = null;

/** 100 professional active listings across all categories and emirates. */
export function getLiveMarketplaceCatalogListings(): Listing[] {
  if (cached) return cached;
  if (SEED_DEFS.length !== LIVE_MARKETPLACE_COUNT) {
    throw new Error(
      `Live marketplace catalog must have exactly ${LIVE_MARKETPLACE_COUNT} listings (got ${SEED_DEFS.length})`,
    );
  }
  cached = SEED_DEFS.map((def, index) => buildListing(def, index));
  return cached;
}
