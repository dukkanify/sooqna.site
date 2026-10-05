import type { Listing } from "@/types";
import type { ListingCopySource } from "@/types/domain/listing";

/**
 * Persistable bilingual listing copy.
 * Arabic title/description are never rewritten. English is filled only when
 * empty, tagged seller vs machine, and seller English is never overwritten.
 */

const PHRASES: Array<[string, string]> = [
  ["بحالة ممتازة جداً", "in excellent condition"],
  ["بحالة ممتازة", "in excellent condition"],
  ["بحالة جيدة جداً", "in very good condition"],
  ["بحالة جيدة", "in good condition"],
  ["شبه جديد", "like new"],
  ["شبه جديدة", "like new"],
  ["استخدام خفيف", "lightly used"],
  ["بدون حوادث", "accident-free"],
  ["صبغ الوكالة", "agency paint"],
  ["مواصفات خليجية", "GCC specs"],
  ["مواصفات الخليج", "GCC specs"],
  ["فل أوبشن", "full option"],
  ["فل اوبشن", "full option"],
  ["فل أوبشنز", "full option"],
  ["تأمين شامل", "comprehensive insurance"],
  ["جاهز للتحويل", "ready for transfer"],
  ["قابل للتفاوض", "negotiable"],
  ["غير قابل للتفاوض", "non-negotiable"],
  ["مع الكرتون والشاحن", "with box and charger"],
  ["مع الكرتون", "with box"],
  ["مع الشاحن", "with charger"],
  ["مع الضمان", "with warranty"],
  ["تحت الضمان", "under warranty"],
  ["انتهى الضمان", "warranty expired"],
  ["قطعة واحدة", "single owner"],
  ["مالك أول", "first owner"],
  ["المالك الأول", "first owner"],
  ["دوام كامل", "full-time"],
  ["دوام جزئي", "part-time"],
  ["عن بعد", "remote"],
  ["حسب عرض سعر", "quote on request"],
  ["مطلوب فوراً", "needed immediately"],
  ["للتواصل واتساب", "contact on WhatsApp"],
  ["تواصل واتساب", "WhatsApp"],
  ["غرفة نوم ماستر", "master bedroom"],
  ["غرفة خادمة", "maid’s room"],
  ["موقف سيارة", "parking"],
  ["موقف سيارات", "parking"],
  ["طابق أرضي", "ground floor"],
  ["للإيجار السنوي", "for yearly rent"],
  ["للإيجار الشهري", "for monthly rent"],
  ["للبيع", "for sale"],
  ["للإيجار", "for rent"],
  ["آيفون", "iPhone"],
  ["ايفون", "iPhone"],
  ["ماك بوك", "MacBook"],
  ["ماك بوك برو", "MacBook Pro"],
  ["آيباد", "iPad"],
  ["ايباد", "iPad"],
  ["بلايستيشن", "PlayStation"],
  ["بلاي ستيشن", "PlayStation"],
  ["برو ماكس", "Pro Max"],
  ["أبوظبي", "Abu Dhabi"],
  ["ابوظبي", "Abu Dhabi"],
  ["رأس الخيمة", "Ras Al Khaimah"],
  ["راس الخيمة", "Ras Al Khaimah"],
  ["أم القيوين", "Umm Al Quwain"],
  ["ام القيوين", "Umm Al Quwain"],
  ["الشارقة", "Sharjah"],
  ["الفجيرة", "Fujairah"],
  ["العين", "Al Ain"],
  ["دبي مارينا", "Dubai Marina"],
  ["الخليج التجاري", "Business Bay"],
  ["جزيرة ياس", "Yas Island"],
  ["النخلة", "Palm Jumeirah"],
  ["لاند كروزر", "Land Cruiser"],
  ["بي ام دبليو", "BMW"],
  ["بي إم دبليو", "BMW"],
  ["مرسيدس", "Mercedes"],
  ["تويوتا", "Toyota"],
  ["نيسان", "Nissan"],
  ["هوندا", "Honda"],
  ["لكزس", "Lexus"],
  ["هيونداي", "Hyundai"],
  ["شيفروليه", "Chevrolet"],
  ["باترول", "Patrol"],
  ["كامري", "Camry"],
  ["اكورد", "Accord"],
  ["أكورد", "Accord"],
  ["كيا", "Kia"],
  ["فورد", "Ford"],
  ["بورش", "Porsche"],
  ["تسلا", "Tesla"],
];

const WORDS: Record<string, string> = {
  جديد: "new",
  جديدة: "new",
  مستعمل: "used",
  مستعملة: "used",
  ممتاز: "excellent",
  ممتازة: "excellent",
  نظيف: "clean",
  نظيفة: "clean",
  أصلي: "original",
  اصلية: "original",
  أصليّ: "original",
  ضمان: "warranty",
  كرتون: "box",
  جهاز: "device",
  الشاحن: "charger",
  شاحن: "charger",
  إكسسوارات: "accessories",
  اكسسوارات: "accessories",
  ذاكرة: "storage",
  لون: "color",
  أبيض: "white",
  أسود: "black",
  أزرق: "blue",
  ذهبي: "gold",
  فضي: "silver",
  أحمر: "red",
  أخضر: "green",
  سيارة: "car",
  سيارات: "cars",
  موتر: "car",
  موتور: "engine",
  جير: "transmission",
  أوتوماتيك: "automatic",
  اوتوماتيك: "automatic",
  عادي: "manual",
  بنزين: "petrol",
  ديزل: "diesel",
  هايبرد: "hybrid",
  كهربائي: "electric",
  كهربائية: "electric",
  كيلومتر: "km",
  كم: "km",
  عداد: "mileage",
  سنة: "year",
  سنوات: "years",
  موديل: "model",
  ماركة: "brand",
  وكالة: "agency",
  فحص: "inspection",
  ملكية: "ownership",
  تحويل: "transfer",
  سعر: "price",
  درهم: "AED",
  "د.إ": "AED",
  تفاوض: "negotiable",
  عاجل: "urgent",
  فرصة: "opportunity",
  شقة: "apartment",
  فيلا: "villa",
  تاونهاوس: "townhouse",
  استوديو: "studio",
  مكتب: "office",
  أرض: "plot",
  غرفة: "bedroom",
  غرف: "bedrooms",
  نوم: "bedroom",
  حمام: "bathroom",
  حمامات: "bathrooms",
  مفروش: "furnished",
  مفروشة: "furnished",
  مكيف: "air-conditioned",
  إطلالة: "view",
  اطلالة: "view",
  بحر: "sea",
  مدينة: "city",
  موقع: "location",
  قريب: "near",
  قريبة: "near",
  مجمع: "community",
  برج: "tower",
  طابق: "floor",
  مساحة: "area",
  قدم: "sqft",
  وظيفة: "job",
  راتب: "salary",
  خبرة: "experience",
  دوام: "shift",
  تواصل: "contact",
  واتساب: "WhatsApp",
  هاتف: "phone",
  رقم: "number",
  وصف: "description",
  إعلان: "listing",
  اعلان: "listing",
  بيع: "sale",
  شراء: "buy",
  توصيل: "delivery",
  استلام: "pickup",
  قطط: "cats",
  كلاب: "dogs",
  طيور: "birds",
  حيوان: "pet",
  لقح: "vaccinated",
  ملقح: "vaccinated",
  ملقحة: "vaccinated",
  دبي: "Dubai",
  عجمان: "Ajman",
  الشارقة: "Sharjah",
  مع: "with",
  بدون: "without",
  في: "in",
  من: "from",
  على: "on",
  إلى: "to",
  الى: "to",
  هذا: "this",
  هذه: "this",
  جداً: "very",
  جدا: "very",
  فقط: "only",
  أيضاً: "also",
  ايضا: "also",
  يوجد: "includes",
  تشمل: "includes",
  شامل: "inclusive",
  جاهز: "ready",
  جاهزة: "ready",
  فوري: "immediate",
  فوراً: "immediately",
  اليوم: "today",
  المالك: "owner",
  البائع: "seller",
  المشتري: "buyer",
  حقيقي: "genuine",
  حقيقية: "genuine",
  نادر: "rare",
  نادرة: "rare",
  عرض: "offer",
  تخفيض: "discount",
  صيانة: "maintenance",
  خدمة: "service",
  خدمات: "services",
};

const SORTED_PHRASES = [...PHRASES].sort((a, b) => b[0].length - a[0].length);

const TOKEN = (i: number) => `\u0000T${i}\u0001`;
const TOKEN_RE = /\u0000T(\d+)\u0001/g;
const LATIN_OR_NUM_RE =
  /[A-Za-z][A-Za-z0-9.+/-]*|\d+(?:[.,]\d+)?(?:\s?(?:GB|TB|MB|km|KM|cc|hp|HP|inch|in))?/g;

function protectTokens(text: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  const next = text.replace(LATIN_OR_NUM_RE, (match) => {
    const index = tokens.length;
    tokens.push(match);
    return TOKEN(index);
  });
  return { text: next, tokens };
}

function restoreTokens(text: string, tokens: string[]): string {
  return text.replace(TOKEN_RE, (_, index: string) => tokens[Number(index)] ?? "");
}

function applyPhrases(text: string): string {
  let next = text;
  for (const [arabic, english] of SORTED_PHRASES) {
    if (!arabic || !next.includes(arabic)) continue;
    next = next.split(arabic).join(english);
  }
  return next;
}

function lookupWord(token: string): string | undefined {
  if (WORDS[token]) return WORDS[token];
  if (token.startsWith("و") && token.length > 1) {
    const rest = lookupWord(token.slice(1));
    if (rest) return `and ${rest}`;
  }
  if (token.startsWith("ال") && token.length > 2) {
    return WORDS[token.slice(2)];
  }
  return undefined;
}

function applyWords(text: string): string {
  return text
    .split(/(\s+|[,،.;:!?()[\]{}"“”«»]+)/)
    .map((part) => {
      if (!part || !/[\u0600-\u06FF]/.test(part)) return part;
      const key = part.replace(/[^\u0600-\u06FFa-zA-Z]/g, "");
      return lookupWord(key) ?? lookupWord(part) ?? part;
    })
    .join("");
}

function tidyEnglish(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+\/\s+/g, " / ")
    .replace(/\s+—\s+/g, " — ")
    .replace(/\s+-\s+/g, " - ")
    .trim();
}

/** Glossary + token-preserving MT. Never touches prices, brands, models, or Latin specs. */
export function translateArabicToEnglish(input: string): string {
  const source = input.trim();
  if (!source) return "";
  if (!/[\u0600-\u06FF]/.test(source)) return source;

  const protectedSource = protectTokens(source);
  const phrased = applyPhrases(protectedSource.text);
  const worded = applyWords(phrased);
  return tidyEnglish(restoreTokens(worded, protectedSource.tokens));
}

type CopyFields = Pick<
  Listing,
  | "title"
  | "description"
  | "titleEnglish"
  | "descriptionEnglish"
  | "titleTranslationSource"
  | "descriptionTranslationSource"
>;

function resolveEnglishField(opts: {
  arabic: string;
  incoming?: string;
  previousArabic?: string;
  previousEnglish?: string;
  previousSource?: ListingCopySource;
}): { value?: string; source?: ListingCopySource } {
  const incoming = opts.incoming?.trim() ?? "";
  const previousEnglish = opts.previousEnglish?.trim() ?? "";
  const previousSource = opts.previousSource;

  if (incoming && incoming !== previousEnglish) {
    return { value: incoming, source: "seller" };
  }

  if (incoming && incoming === previousEnglish) {
    if (previousSource === "machine") {
      if ((opts.previousArabic ?? "") === opts.arabic) {
        return { value: incoming, source: "machine" };
      }
      const machine = translateArabicToEnglish(opts.arabic).trim();
      return machine
        ? { value: machine, source: "machine" }
        : { value: incoming, source: "machine" };
    }
    return { value: incoming, source: previousSource ?? "seller" };
  }

  if (previousSource === "seller" && previousEnglish) {
    return { value: previousEnglish, source: "seller" };
  }

  if (
    previousSource === "machine" &&
    previousEnglish &&
    (opts.previousArabic ?? "") === opts.arabic
  ) {
    return { value: previousEnglish, source: "machine" };
  }

  const machine = translateArabicToEnglish(opts.arabic).trim();
  if (!machine) {
    return previousEnglish
      ? { value: previousEnglish, source: previousSource ?? "machine" }
      : {};
  }
  return { value: machine, source: "machine" };
}

export function sellerEnglishPrefill(listing?: CopyFields | null): {
  titleEnglish?: string;
  descriptionEnglish?: string;
} {
  if (!listing) return {};
  const titleIsSeller =
    listing.titleTranslationSource !== "machine" &&
    Boolean(listing.titleEnglish?.trim());
  const descriptionIsSeller =
    listing.descriptionTranslationSource !== "machine" &&
    Boolean(listing.descriptionEnglish?.trim());
  return {
    ...(titleIsSeller ? { titleEnglish: listing.titleEnglish } : {}),
    ...(descriptionIsSeller
      ? { descriptionEnglish: listing.descriptionEnglish }
      : {}),
  };
}

/** Persist English counterparts. Never mutates Arabic title/description. */
export function enrichListingCopy<T extends CopyFields>(
  next: T,
  previous?: CopyFields | null,
): T {
  const title = next.title;
  const description = next.description;
  const titleEn = resolveEnglishField({
    arabic: title,
    incoming: next.titleEnglish,
    previousArabic: previous?.title,
    previousEnglish: previous?.titleEnglish,
    previousSource: previous?.titleTranslationSource,
  });
  const descriptionEn = resolveEnglishField({
    arabic: description,
    incoming: next.descriptionEnglish,
    previousArabic: previous?.description,
    previousEnglish: previous?.descriptionEnglish,
    previousSource: previous?.descriptionTranslationSource,
  });

  return {
    ...next,
    title,
    description,
    titleEnglish: titleEn.value,
    titleTranslationSource: titleEn.source,
    descriptionEnglish: descriptionEn.value,
    descriptionTranslationSource: descriptionEn.source,
  };
}
