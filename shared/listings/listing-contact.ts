import type { Listing } from "@/types";

/** Digits-only E.164 without plus, e.g. 971501234567 */
export function toE164Digits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (digits.startsWith("00971")) normalized = digits.slice(2);
  else if (digits.startsWith("971")) normalized = digits;
  else if (digits.startsWith("00") && digits.length > 4) normalized = digits.slice(2);
  else if (digits.startsWith("0")) normalized = `971${digits.slice(1)}`;
  else if (digits.startsWith("5") && digits.length === 9) normalized = `971${digits}`;

  if (normalized.startsWith("971") && normalized.length >= 11) {
    return normalized.slice(0, 12);
  }
  if (normalized.length >= 10) return normalized;
  return null;
}

/** Real listing phone only — never invent a placeholder number. */
export function getListingContactPhone(listing: Listing): string | null {
  const raw = listing.contactPhone?.trim();
  return raw ? toE164Digits(raw) : null;
}

export function getMaskedPhone(listing: Listing): string | null {
  const phone = getListingContactPhone(listing);
  if (!phone) return null;
  const local = phone.startsWith("971") ? `0${phone.slice(3)}` : phone;
  if (local.length < 6) return local;
  return `${local.slice(0, 3)} *** ${local.slice(-2)}`;
}

export function getTelHref(listing: Listing): string | null {
  const phone = getListingContactPhone(listing);
  return phone ? `tel:+${phone}` : null;
}

export function getDisplayPhone(listing: Listing): string | null {
  const phone = getListingContactPhone(listing);
  if (!phone) return null;
  if (phone.startsWith("971") && phone.length >= 11) {
    const local = `0${phone.slice(3)}`;
    if (local.length === 10) {
      return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    }
    return local;
  }
  return phone;
}

export function getWhatsAppHref(listing: Listing, listingUrl: string): string | null {
  const phone = getListingContactPhone(listing);
  if (!phone) return null;
  const message = `مرحباً، أتواصل معك بخصوص إعلان:\n${listing.title}\nعلى منصة سوقنا.\n${listingUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
