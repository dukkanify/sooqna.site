/**
 * UAE mobile numbers — format-smart, no OTP.
 * Accepts 050/052/054/055/056/058 (and 057), +971, 00971, Arabic digits, spaces.
 */

const EASTERN_ARABIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** Assigned UAE mobile second digits after 5 (TRA): 50, 52, 54, 55, 56, 58; 57 used by some MVNOs. */
const MOBILE_SECOND_DIGITS = new Set(["0", "2", "4", "5", "6", "7", "8"]);

export const UAE_MOBILE_ERROR =
  "اكتب رقم جوال إماراتي صحيح (مثال: 0501234567).";

export const UAE_MOBILE_PREFIX_HINT =
  "استخدم رقم جوال إماراتي يبدأ بـ 050 أو 052 أو 054 أو 055 أو 056 أو 058.";

export function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (char) => {
    const eastern = EASTERN_ARABIC.indexOf(char);
    if (eastern >= 0) return String(eastern);
    const persian = PERSIAN.indexOf(char);
    return persian >= 0 ? String(persian) : char;
  });
}

function digitsOnly(value: string): string {
  return toAsciiDigits(value).replace(/\D/g, "");
}

/**
 * 9-digit national subscriber (5xxxxxxxx) or null.
 */
export function extractUaeMobileSubscriber(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let digits = digitsOnly(trimmed);
  if (digits.startsWith("00971")) digits = digits.slice(5);
  else if (digits.startsWith("971")) digits = digits.slice(3);
  else if (digits.startsWith("00") && digits.length > 4) {
    return null;
  } else if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length !== 9 || !digits.startsWith("5")) return null;
  return digits;
}

export function isValidUaeMobile(value: string): boolean {
  const subscriber = extractUaeMobileSubscriber(value);
  if (!subscriber) return false;
  if (/^(\d)\1{8}$/.test(subscriber)) return false;
  return true;
}

/** Marketplace / checkout contact numbers are UAE mobiles. */
export function isValidUaePhone(value: string): boolean {
  return isValidUaeMobile(value);
}

export function formatUaeMobileNational(value: string): string {
  const subscriber = extractUaeMobileSubscriber(value);
  return subscriber ? `0${subscriber}` : "";
}

export function formatUaeMobilePretty(value: string): string {
  const national = formatUaeMobileNational(value);
  if (national.length !== 10) return value.trim();
  return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

/** E.164 (+9715xxxxxxxx) when valid; otherwise the trimmed original. */
export function normalizeUaePhone(value: string): string {
  const subscriber = extractUaeMobileSubscriber(value);
  if (subscriber && isValidUaeMobile(value)) {
    return `+971${subscriber}`;
  }
  return value.trim();
}

/**
 * Prefill listing/profile fields only from a real UAE mobile.
 * Empty / placeholder / junk profile values stay blank.
 */
export function listingPrefillPhone(
  raw: string | null | undefined,
): string {
  if (!raw || !raw.trim()) return "";
  return isValidUaeMobile(raw) ? formatUaeMobileNational(raw) : "";
}

export function uaeMobileIssue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return UAE_MOBILE_ERROR;
  const subscriber = extractUaeMobileSubscriber(trimmed);
  if (!subscriber) return UAE_MOBILE_ERROR;
  if (/^(\d)\1{8}$/.test(subscriber)) return UAE_MOBILE_ERROR;
  return null;
}

export function hasUsualUaeMobilePrefix(value: string): boolean {
  const subscriber = extractUaeMobileSubscriber(value);
  if (!subscriber) return false;
  return MOBILE_SECOND_DIGITS.has(subscriber[1] ?? "");
}

/** Keep digits, +, spaces and dashes while converting Arabic numerals. */
export function sanitizeUaePhoneInput(value: string): string {
  const ascii = toAsciiDigits(value);
  return ascii.replace(/[^\d+\s-]/g, "").slice(0, 18);
}
