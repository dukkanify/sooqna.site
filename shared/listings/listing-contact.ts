import type { Listing } from "@/types";
import { extractUaeMobileSubscriber, isValidUaeMobile } from "@/shared/utils/phone";

/** Digits-only E.164 without plus, e.g. 971501234567 */
export function toE164Digits(phone: string): string | null {
  if (!isValidUaeMobile(phone)) return null;
  const subscriber = extractUaeMobileSubscriber(phone);
  return subscriber ? `971${subscriber}` : null;
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
