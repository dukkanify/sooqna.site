import type { AppLocale } from "./locale";
import phrasesEn from "./phrases.en.json";

const EN = phrasesEn as Record<string, string>;

const MONTHS =
  "يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر";
const DATE_RE = new RegExp(`^(\\d{1,2}) (${MONTHS})$`);

const NAME_TEMPLATES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [
    /^مرحباً (.+)، حسابك في سوقنا نشط الآن\. ابدأ بنشر إعلان أو تصفّح العروض\.$/u,
    (match) =>
      `Hello ${match[1]}, your Sooqna account is now active. Post an ad or start browsing listings.`,
  ],
  [
    /^تم التحقق من (.+) \((.+)\)\. اعتمد الحساب بضغطة واحدة\.$/u,
    (match) =>
      `${match[1]} (${match[2]}) has been verified. Approve the account in one click.`,
  ],
  [
    /^(.+) قدّم على وظيفة «(.+)»\.$/u,
    (match) => `${match[1]} applied for “${match[2]}”.`,
  ],
  [
    /^(.+) راسلك بخصوص «(.+)»\.$/u,
    (match) => `${match[1]} messaged you about “${match[2]}”.`,
  ],
  [
    /^خلال (\d+) (?:دقيقة|دقائق)$/u,
    (match) => `Within ${match[1]} minutes`,
  ],
  [
    /^خلال ساعة$/u,
    () => "Within an hour",
  ],
  [
    /^خلال ساعتين$/u,
    () => "Within 2 hours",
  ],
  [
    /^التقديم على: (.+)$/u,
    (match) => `Apply for: ${match[1]}`,
  ],
  [
    /^حجز معاينة: (.+)$/u,
    (match) => `Viewing booking: ${match[1]}`,
  ],
  [
    /^طلب رقم (.+)$/u,
    (match) => `Order ${match[1]}`,
  ],
  [
    /^حذف (.+)$/u,
    (match) => `Delete ${match[1]}`,
  ],
  [
    /^نتائج: (.+)$/u,
    (match) => `Results: ${match[1]}`,
  ],
  [
    /^(\d+) صورة$/u,
    (match) => `${match[1]} images`,
  ],
  [
    /^صورة محفوظة (\d+)$/u,
    (match) => `Saved image ${match[1]}`,
  ],
  [
    /^معاينة صورة جديدة (\d+)$/u,
    (match) => `New image preview ${match[1]}`,
  ],
  [
    /^معاينة صورة (\d+)$/u,
    (match) => `Image preview ${match[1]}`,
  ],
  [
    /^تم تأكيد حجز المعاينة وأرسلنا التفاصيل إلى (.+)\.$/u,
    (match) => `Viewing confirmed and details sent to ${match[1]}.`,
  ],
  [
    /^([\d,]+)\s*إعلان$/u,
    (match) => `${match[1]} listings`,
  ],
  [
    /^([\d,]+)\s*إعلان نشط في هذا القسم$/u,
    (match) => `${match[1]} active listings in this category`,
  ],
  [
    /^([\d,]+)\s*إعلان نشط في الإمارات$/u,
    (match) => `${match[1]} active listings across the UAE`,
  ],
  [
    /^([\d,]+)\s*نتيجة$/u,
    (match) => `${match[1]} results`,
  ],
  [
    /^منذ (\d+) د$/u,
    (match) => `${match[1]}m ago`,
  ],
  [
    /^منذ (\d+) س$/u,
    (match) => `${match[1]}h ago`,
  ],
  [
    /^(\d+) فلتر نشط$/u,
    (match) => `${match[1]} active filters`,
  ],
  [
    /^(\d+) محفوظ$/u,
    (match) => `${match[1]} saved`,
  ],
  [
    /^إعادة الإرسال خلال (\d+)ث$/u,
    (match) => `Resend in ${match[1]}s`,
  ],
  [
    /^مهلة النزاع: حتى (.+)\.$/u,
    (match) => `Dispute window: until ${match[1]}.`,
  ],
  [
    /^(.+) — قريبًا$/u,
    (match) => `${tx("en", match[1])} — Coming soon`,
  ],
  [
    /^(.+)، (\d+) غير مقروء$/u,
    (match) => `${tx("en", match[1])}, ${match[2]} unread`,
  ],
  [
    /^مع (.+)$/u,
    (match) => `with ${match[1]}`,
  ],
  [
    /^آخر تحديث: (.+)$/u,
    (match) => `Last updated: ${match[1]}`,
  ],
  [
    /^(\d+) ماركة — مرّر أو اكتب للبحث$/u,
    (match) => `${match[1]} makes — scroll or type to search`,
  ],
  [
    /^(\d+) موديل — مرّر أو اكتب للبحث$/u,
    (match) => `${match[1]} models — scroll or type to search`,
  ],
  [
    /^لا توجد ماركة مطابقة — سيتم حفظ «(.+)» كما كتبتها\.$/u,
    (match) => `No matching make — “${match[1]}” will be saved as typed.`,
  ],
  [
    /^(.+) مطلوب\.$/u,
    (match) => `${tx("en", match[1])} is required.`,
  ],
  [
    /^(.+) يجب أن يكون رقماً\.$/u,
    (match) => `${tx("en", match[1])} must be a number.`,
  ],
  [
    /^\(المحاولات المتبقية: (\d+)\)$/u,
    (match) => `(Attempts left: ${match[1]})`,
  ],
  [
    /^رقم (.+)$/u,
    (match) => `Number ${match[1]}`,
  ],
  [
    /^رمز التحقق: (.+)$/u,
    (match) => `Verification code: ${match[1]}`,
  ],
  [
    /^تبقّى أقل من (\d+) ساعة لفتح نزاع\.$/u,
    (match) => `Less than ${match[1]} hours left to open a dispute.`,
  ],
  [
    /^تبقّى حوالي (\d+) ساعة لفتح نزاع \(تنبيه 48 ساعة\)\.$/u,
    (match) => `About ${match[1]} hours left to open a dispute (48h notice).`,
  ],
  [
    /^تم تحديث الحالة إلى: (.+)$/u,
    (match) => `Status updated to: ${tx("en", match[1])}`,
  ],
  [
    /^خريطة موقع (.+)$/u,
    (match) => `Location map: ${match[1]}`,
  ],
  [
    /^صورة (\d+)$/u,
    (match) => `Image ${match[1]}`,
  ],
  [
    /^صورة واحدة على الأقل مطلوبة — حتى (\d+) صور$/u,
    (match) => `At least one photo required — up to ${match[1]} photos`,
  ],
  [
    /^يمكنك إضافة حتى (\d+) صورة$/u,
    (match) => `You can add up to ${match[1]} photos`,
  ],
  [
    /^طلب حجز خدمة «(.+)»$/u,
    (match) => `Service booking request: “${match[1]}”`,
  ],
  [
    /^طلب عرض سعر لخدمة «(.+)»$/u,
    (match) => `Quote request for “${match[1]}”`,
  ],
  [
    /^مرحباً، أنا مهتم بإعلان «(.+)»\.$/u,
    (match) => `Hi, I’m interested in “${match[1]}”.`,
  ],
  [
    /^استلمنا رسالتك وأرسلنا تأكيدًا إلى بريدك\. يمكنك أيضًا مراسلتنا على (.+)\.$/u,
    (match) =>
      `We received your message and emailed a confirmation. You can also reach us at ${match[1]}.`,
  ],
  [
    /^استلمنا رسالتك\. إذا احتجت تواصلًا أسرع راسلنا على (.+)\.$/u,
    (match) =>
      `We received your message. For faster help, email ${match[1]}.`,
  ],
  [
    /^تصفح إعلانات (.+) في (.+)\.$/u,
    (match) =>
      `Browse ${tx("en", match[1])} listings in ${tx("en", match[2])}.`,
  ],
  [
    /^تصفح كل إعلانات (.+) على (.+)\.$/u,
    (match) =>
      `Browse all of ${match[1]}’s listings on ${tx("en", match[2])}.`,
  ],
  [
    /^للاستفسارات غير المرتبطة بنزاع مفتوح، استخدم صفحة الدعم أو (.+)\.$/u,
    (match) =>
      `For questions not tied to an open dispute, use Support or ${match[1]}.`,
  ],
  [
    /^واجهة تعديل الإعلان "(.+)" جاهزة للربط مع API التعديل\.$/u,
    (match) =>
      `Listing edit UI for “${match[1]}” is ready to wire to the edit API.`,
  ],
  [
    /^من (.+)$/u,
    (match) => `From ${tx("en", match[1])}`,
  ],
  [
    /^إلى (.+)$/u,
    (match) => `To ${tx("en", match[1])}`,
  ],
];

const UNIT_SUFFIXES: Array<[RegExp, string]> = [
  [/ قدم مربع$/u, " sq ft"],
  [/ كم$/u, " km"],
];

/** UAE emirates + all-emirates labels — used to detect location compounds. */
const UAE_PLACE_ANCHORS = new Set([
  "دبي",
  "أبوظبي",
  "الشارقة",
  "عجمان",
  "أم القيوين",
  "رأس الخيمة",
  "الفجيرة",
  "جميع الإمارات",
  "كل الإمارات",
  "الإمارات",
  "الإمارات العربية المتحدة",
]);

function lookup(text: string): string | undefined {
  const direct = EN[text];
  if (direct) return direct;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed !== text) return EN[collapsed];
  return undefined;
}

/** Translate area / emirate labels segment-by-segment for English locale. */
export function txLocation(locale: AppLocale, text: string): string {
  if (locale !== "en" || !text) return text;
  const direct = lookup(text);
  if (direct) return direct;

  const separators: Array<[RegExp, string]> = [
    [/\s*،\s*/u, ", "],
    [/\s*,\s*/u, ", "],
    [/\s*•\s*/u, " • "],
    [/\s*·\s*/u, " · "],
  ];

  for (const [pattern, joinWith] of separators) {
    if (!pattern.test(text)) continue;
    const parts = text.split(pattern).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const translated = parts.map((part) => lookup(part) ?? part);
    if (translated.some((part, index) => part !== parts[index])) {
      return translated.join(joinWith);
    }
  }

  return text;
}

function translatePlaceCompound(text: string): string | undefined {
  if (!text.includes("، ") && !text.includes(", ")) return undefined;
  const parts = text.split(/\s*[،,]\s*/u).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;
  const looksLikeLocation = parts.some(
    (part) => UAE_PLACE_ANCHORS.has(part) || Boolean(lookup(part)),
  );
  if (!looksLikeLocation) return undefined;
  const translated = parts.map((part) => lookup(part) ?? part);
  if (translated.every((part, index) => part === parts[index])) return undefined;
  return translated.join(", ");
}

function translateGuillemets(text: string): string | undefined {
  const amounts: string[] = [];
  const names: string[] = [];
  let template = text.replace(
    /\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*AED|AED\s*\d{1,3}(?:,\d{3})*(?:\.\d+)?/g,
    (match) => {
      amounts.push(match);
      return "{amount}";
    },
  );
  template = template.replace(/«([^»]*)»/g, (_, inner: string) => {
    names.push(inner);
    return "«…»";
  });
  if (amounts.length === 0 && names.length === 0) return undefined;
  const hit = lookup(template);
  if (!hit) return undefined;
  let amountIndex = 0;
  let nameIndex = 0;
  return hit.replace(/\{amount\}|«…»|“…”/g, (match) => {
    if (match === "{amount}") {
      return amounts[amountIndex++] ?? "";
    }
    const value = names[nameIndex++] ?? "";
    return `“${value}”`;
  });
}

function applyUnits(text: string): string {
  let next = text;
  for (const [pattern, suffix] of UNIT_SUFFIXES) {
    if (pattern.test(next)) {
      next = next.replace(pattern, suffix);
    }
  }
  return next;
}

/**
 * Translate a stored/UI Arabic phrase when English is selected.
 * Unknown strings (including user-generated listing copy) stay unchanged.
 */
export function tx(locale: AppLocale, text: string): string {
  if (locale !== "en" || !text) return text;
  const hit = lookup(text);
  if (hit) return hit;

  const guillemet = translateGuillemets(text);
  if (guillemet) return guillemet;

  for (const [pattern, render] of NAME_TEMPLATES) {
    const match = text.match(pattern);
    if (match) return render(match);
  }

  const date = text.match(DATE_RE);
  if (date) {
    const month = lookup(date[2]);
    if (month) return `${date[1]} ${month}`;
  }

  const withUnits = applyUnits(text);
  if (withUnits !== text) {
    const unitHit = lookup(withUnits);
    return unitHit ?? withUnits;
  }

  const place = translatePlaceCompound(text);
  if (place) return place;

  if (text.includes(" · ")) {
    return text
      .split(" · ")
      .map((part) => tx(locale, part))
      .join(" · ");
  }
  if (text.includes(" • ")) {
    return text
      .split(" • ")
      .map((part) => tx(locale, part))
      .join(" • ");
  }
  if (text.includes(" — ")) {
    return text
      .split(" — ")
      .map((part) => tx(locale, part))
      .join(" — ");
  }
  if (text.includes("، ")) {
    const parts = text.split("، ");
    const translated = parts.map((part) => lookup(part));
    // Only join when every segment has a full translation — otherwise
    // partial hits create mixed Arabic/English (e.g. "Real Estate" mid-sentence).
    if (translated.every((part): part is string => Boolean(part))) {
      return translated.join(", ");
    }
  }
  return text;
}

export function txList(locale: AppLocale, items: readonly string[]): string[] {
  return items.map((item) => tx(locale, item));
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
