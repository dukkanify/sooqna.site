import type { Listing, UserProfile } from "@/types";
import type { DeliveryAddressInput } from "@/services/payments/payment-schemas";
import type { ShippingMethodId } from "@/types/domain/address";
import { getListingActionConfig } from "@/shared/constants/listingActionConfig";
import { isGuestCheckoutEnabled, isMockCheckoutEnabled } from "@/shared/constants/feature-flags";
import { isOwnListing } from "@/shared/listings/listing-ownership";
import { listingMeetsPurchaseRules } from "@/shared/listings/purchase-eligibility";
import { isValidUaePhone, normalizeUaePhone } from "@/shared/utils/phone";

export const CHECKOUT_ERRORS = {
  incompleteListing: "تعذر متابعة الطلب لأن بيانات الإعلان غير مكتملة.",
  ownListing: "لا يمكنك شراء إعلانك الخاص.",
  unavailable: "هذا الإعلان غير متاح للشراء حاليًا.",
  sessionRequired: "انتهت الجلسة. سجّل الدخول للمتابعة.",
  addressLoadFailed: "تعذر تحميل العناوين. حاول مرة أخرى.",
  invalidEmail: "اكتب بريدًا إلكترونيًا صحيحًا.",
  invalidPhone: "اكتب رقم هاتف إماراتي صحيحًا.",
  nameRequired: "الاسم الكامل مطلوب.",
  emirateRequired: "اختر الإمارة.",
  addressLineRequired: "اكتب عنوان التوصيل بالكامل.",
  addressRequired: "اختر الإمارة واكتب عنوان التوصيل.",
  savedAddressRequired: "اختر عنوان التوصيل المحفوظ.",
  fieldsIncomplete: "أكمل الحقول المطلوبة أدناه.",
} as const;

export type CheckoutReviewValidation =
  | { ok: true }
  | { ok: false; message: string; redirectToLogin?: boolean };

export type GuestBuyerInfo = {
  fullName: string;
  email: string;
  phone: string;
};

export type GuestDeliveryInfo = GuestBuyerInfo & {
  shippingMethod: ShippingMethodId;
  emirate?: string;
  addressLine?: string;
  saveAddress?: boolean;
  city?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateCheckoutReviewStep(
  listing: Listing | null | undefined,
  buyer: UserProfile | null,
): CheckoutReviewValidation {
  if (!buyer && !isGuestCheckoutEnabled()) {
    return {
      ok: false,
      message: CHECKOUT_ERRORS.sessionRequired,
      redirectToLogin: true,
    };
  }

  if (!listing) {
    return { ok: false, message: CHECKOUT_ERRORS.incompleteListing };
  }

  if (
    !listing.seller?.id ||
    !listing.seller?.name ||
    !Number.isFinite(listing.price) ||
    listing.price <= 0
  ) {
    return { ok: false, message: CHECKOUT_ERRORS.incompleteListing };
  }

  if (listing.status !== "active") {
    return { ok: false, message: CHECKOUT_ERRORS.unavailable };
  }

  const config = getListingActionConfig(listing);
  if (
    !config.checkoutEnabled &&
    !(isMockCheckoutEnabled() && listingMeetsPurchaseRules(listing))
  ) {
    return { ok: false, message: CHECKOUT_ERRORS.unavailable };
  }

  if (buyer && isOwnListing(listing, buyer)) {
    return { ok: false, message: CHECKOUT_ERRORS.ownListing };
  }

  return { ok: true };
}

export type CheckoutFieldKey =
  | "fullName"
  | "email"
  | "phone"
  | "emirate"
  | "addressLine"
  | "savedAddress";

export type CheckoutFieldErrors = Partial<Record<CheckoutFieldKey, string>>;

export function validateGuestBuyerFields(input: GuestBuyerInfo): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  if (input.fullName.trim().length < 2) {
    errors.fullName = CHECKOUT_ERRORS.nameRequired;
  }
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    errors.email = CHECKOUT_ERRORS.invalidEmail;
  }
  if (!isValidUaePhone(input.phone)) {
    errors.phone = CHECKOUT_ERRORS.invalidPhone;
  }
  return errors;
}

export function validateGuestBuyerInfo(input: GuestBuyerInfo): string | null {
  const errors = validateGuestBuyerFields(input);
  return (
    errors.fullName ?? errors.email ?? errors.phone ?? null
  );
}

export function validateGuestDeliveryFields(
  input: GuestDeliveryInfo,
  requiresAddress: boolean,
): CheckoutFieldErrors {
  const errors = validateGuestBuyerFields(input);

  if (!requiresAddress || input.shippingMethod === "pickup") {
    return errors;
  }

  const emirate = input.emirate?.trim() ?? "";
  const addressLine = input.addressLine?.trim() ?? "";

  if (!emirate) {
    errors.emirate = CHECKOUT_ERRORS.emirateRequired;
  }
  if (addressLine.length < 4) {
    errors.addressLine = CHECKOUT_ERRORS.addressLineRequired;
  }

  return errors;
}

export function firstCheckoutFieldError(
  errors: CheckoutFieldErrors,
): string | null {
  return (
    errors.fullName ??
    errors.email ??
    errors.phone ??
    errors.emirate ??
    errors.addressLine ??
    errors.savedAddress ??
    null
  );
}

export function validateGuestDeliveryStep(
  input: GuestDeliveryInfo,
  requiresAddress: boolean,
): string | null {
  return firstCheckoutFieldError(
    validateGuestDeliveryFields(input, requiresAddress),
  );
}

export function normalizeGuestBuyer(input: GuestBuyerInfo): GuestBuyerInfo {
  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: normalizeUaePhone(input.phone),
  };
}

export function buildDeliveryAddressInput(
  guestInfo: GuestDeliveryInfo,
  buyer: GuestBuyerInfo,
): DeliveryAddressInput {
  const emirate = guestInfo.emirate?.trim() ?? "";
  const addressLine = guestInfo.addressLine?.trim() ?? "";

  const formattedAddress = guestInfo.formattedAddress?.trim() || addressLine;
  const city = guestInfo.city?.trim() || emirate;
  const area = guestInfo.area?.trim() || addressLine;

  return {
    fullName: buyer.fullName,
    phone: buyer.phone,
    emirate,
    city,
    area,
    street: formattedAddress || addressLine,
    saveAddress: guestInfo.saveAddress,
    latitude: guestInfo.latitude,
    longitude: guestInfo.longitude,
    formattedAddress: guestInfo.formattedAddress?.trim() || undefined,
  };
}

export function formatSavedAddressLine(address: {
  area: string;
  street: string;
}): string {
  const parts = [address.area, address.street].map((part) => part.trim()).filter(Boolean);
  return parts.join("، ");
}
