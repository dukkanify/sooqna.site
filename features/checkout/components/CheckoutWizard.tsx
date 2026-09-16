"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { DeliveryAddress, ShippingMethodId } from "@/types/domain/address";
import type { Listing } from "@/types";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { ListingTitle } from "@/shared/i18n/ListingTitle";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { SellerName } from "@/shared/i18n/SellerName";
import { listingTitle } from "@/shared/i18n/listing-copy";
import { useLocale } from "@/shared/i18n/useLocale";
import { LISTING_ERRORS } from "@/shared/constants/listing-errors";
import { isGuestCheckoutEnabled, isMockCheckoutEnabled } from "@/shared/constants/feature-flags";
import {
  CHECKOUT_ERRORS,
  buildDeliveryAddressInput,
  formatSavedAddressLine,
  normalizeGuestBuyer,
  validateCheckoutReviewStep,
  validateGuestDeliveryFields,
  type CheckoutFieldErrors,
  type GuestDeliveryInfo,
} from "@/features/checkout/utils/checkout-validation";
import { getLocalListingById } from "@/services/storage";
import { getSessionSnapshot, subscribeSession } from "@/services/storage/external-store";
import {
  calculateShippingFee,
  getAvailableShippingMethods,
  isCategoryShippable,
} from "@/services/shipping/shipping.service";
import { showsEscrowProtection } from "@/shared/listings/escrow-eligibility";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { PageHero } from "@/shared/ui/PageHero";
import { AppImage } from "@/shared/components/AppImage";
import { getListingImageUrl } from "@/features/listings/components/listing-card.utils";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import { CheckoutLiveLocation } from "@/features/checkout/components/CheckoutLiveLocation";
import type { CheckoutLiveLocationValue } from "@/features/checkout/lib/checkout-live-location";

type CheckoutWizardProps = {
  catalogListing?: Listing;
  listingRef?: string;
  paymentCancelled?: boolean;
  fromOrderId?: string;
};

type CheckoutStep = "review" | "delivery" | "payment";

const PLATFORM_FEE_RATE = 0.025;
const GATEWAY_FEE_RATE = 0.029;
const GATEWAY_FEE_FIXED = 1;

const CHECKOUT_API_ERRORS: Record<string, string> = {
  INVALID_INPUT: "بيانات الطلب غير مكتملة. راجع خطوة التوصيل.",
  LISTING_NOT_FOUND: "الإعلان غير موجود.",
  CANNOT_BUY_OWN_LISTING: "لا يمكنك شراء إعلانك الخاص.",
  SHIPPING_UNAVAILABLE: "التوصيل غير متاح لهذا الطلب.",
};

function formatCheckoutApiError(data: unknown): string {
  if (!data || typeof data !== "object" || !("error" in data)) {
    return LISTING_ERRORS.paymentFailed;
  }
  const code = String((data as { error: unknown }).error);
  return CHECKOUT_API_ERRORS[code] ?? `${LISTING_ERRORS.paymentFailed} (${code})`;
}

function calculateTotals(productPrice: number, shippingFee: number) {
  const platformFee = Math.round(productPrice * PLATFORM_FEE_RATE);
  const gatewayFee = Math.round(productPrice * GATEWAY_FEE_RATE + GATEWAY_FEE_FIXED);
  return {
    productPrice,
    shippingFee,
    platformFee,
    gatewayFee,
    total: productPrice + shippingFee + platformFee + gatewayFee,
  };
}

const defaultGuestInfo: GuestDeliveryInfo = {
  fullName: "",
  email: "",
  phone: "",
  shippingMethod: "standard",
  emirate: "دبي",
  addressLine: "",
  saveAddress: false,
};

export function CheckoutWizard({
  catalogListing,
  listingRef,
  paymentCancelled,
  fromOrderId,
}: CheckoutWizardProps) {
  const cities = useMarketplaceLocations();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const transitionLockRef = useRef(false);
  const guestCheckout = isGuestCheckoutEnabled();

  const listing = useSyncExternalStore(
    () => () => undefined,
    () => {
      if (listingRef?.startsWith("local-")) {
        return getLocalListingById(listingRef) ?? catalogListing;
      }
      return catalogListing;
    },
    () => catalogListing,
  );

  const sessionUser = useSyncExternalStore(
    subscribeSession,
    () => getSessionSnapshot(),
    () => null,
  );

  const locale = useLocale();
  const displayTitle = listing ? listingTitle(listing, locale) : "";

  const [step, setStep] = useState<CheckoutStep>("review");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>("standard");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [guestInfo, setGuestInfo] = useState<GuestDeliveryInfo>(defaultGuestInfo);
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [existingAccountHint, setExistingAccountHint] = useState(false);

  const shippable = listing ? isCategoryShippable(listing.categoryId) : false;
  const requiresAddress = shippable && shippingMethod !== "pickup";

  const hasLiveLocation =
    typeof guestInfo.latitude === "number" && typeof guestInfo.longitude === "number";

  const shippingMethods = useMemo(() => {
    if (!listing || !shippable) return [];
    const buyerEmirate = guestInfo.emirate || sessionUser?.city;
    return getAvailableShippingMethods(
      listing.categoryId,
      listing.emirate ?? listing.city,
      buyerEmirate,
    );
  }, [listing, shippable, sessionUser?.city, guestInfo.emirate]);

  const resolvedShippingMethod =
    shippingMethods.some((method) => method.id === shippingMethod) ? shippingMethod : "standard";
  const shippingFee = shippable ? calculateShippingFee(resolvedShippingMethod) : 0;
  const totals = listing ? calculateTotals(listing.price, shippingFee) : null;

  function scrollPanelToTop() {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearDeliveryErrors() {
    setError("");
    setFieldErrors({});
  }

  function focusFirstFieldError(nextErrors: CheckoutFieldErrors) {
    const order: Array<keyof CheckoutFieldErrors> = [
      "fullName",
      "email",
      "phone",
      "savedAddress",
      "emirate",
      "addressLine",
    ];
    const firstKey = order.find((key) => nextErrors[key]);
    const targetName =
      firstKey === "savedAddress" ? "addressId" : firstKey;
    window.requestAnimationFrame(() => {
      if (!targetName) {
        scrollPanelToTop();
        return;
      }
      const field = document.querySelector<HTMLElement>(
        `[name="${targetName}"]`,
      );
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (field && "focus" in field) {
        (field as HTMLInputElement).focus({ preventScroll: true });
      }
    });
  }

  function applyDeliveryFieldErrors(
    nextErrors: CheckoutFieldErrors,
    summary: string = CHECKOUT_ERRORS.fieldsIncomplete,
  ) {
    setFieldErrors(nextErrors);
    setError(summary);
    focusFirstFieldError(nextErrors);
  }

  function advanceStep(next: CheckoutStep) {
    setStep(next);
    setError("");
    setFieldErrors({});
    scrollPanelToTop();
  }

  function prefillGuestFromSession() {
    if (!sessionUser) return;
    setGuestInfo((prev) => ({
      ...prev,
      fullName: prev.fullName || sessionUser.fullName,
      email: prev.email || sessionUser.email,
      phone: prev.phone || sessionUser.phone,
      emirate: prev.emirate || sessionUser.city || "دبي",
    }));
  }

  async function loadAddresses(userId: string) {
    const response = await fetch(`/api/addresses?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error("ADDRESS_LOAD_FAILED");
    }
    const data = await response.json();
    setAddresses(data.addresses ?? []);
    const defaultAddress = (data.addresses as DeliveryAddress[] | undefined)?.find(
      (item) => item.isDefault,
    );
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      setGuestInfo((prev) => ({
        ...prev,
        fullName: defaultAddress.fullName,
        phone: defaultAddress.phone,
        emirate: defaultAddress.emirate,
        addressLine: formatSavedAddressLine(defaultAddress),
      }));
    }
  }

  async function checkEmailExists(email: string) {
    if (!guestCheckout || sessionUser) return;
    try {
      const response = await fetch("/api/checkout/lookup-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (response.ok) {
        const data = await response.json();
        setExistingAccountHint(Boolean(data.hasAccount));
      }
    } catch {
      setExistingAccountHint(false);
    }
  }

  async function handleContinueFromReview() {
    if (transitionLockRef.current || isContinuing) return;

    setError("");
    const buyer = getSessionSnapshot();
    const validation = validateCheckoutReviewStep(listing, buyer);

    if (!validation.ok) {
      if (validation.redirectToLogin) {
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
        return;
      }
      setError(validation.message);
      return;
    }

    transitionLockRef.current = true;
    setIsContinuing(true);

    try {
      prefillGuestFromSession();
      if (shippable) {
        if (buyer) await loadAddresses(buyer.id);
        advanceStep("delivery");
      } else {
        if (guestCheckout && !buyer) {
          advanceStep("delivery");
        } else {
          advanceStep("payment");
        }
      }
    } catch {
      setError(CHECKOUT_ERRORS.addressLoadFailed);
    } finally {
      setIsContinuing(false);
      transitionLockRef.current = false;
    }
  }

  async function handleContinueFromDelivery() {
    if (transitionLockRef.current || isContinuing) return;

    clearDeliveryErrors();
    const buyer = getSessionSnapshot();
    const deliveryInfo: GuestDeliveryInfo = {
      ...guestInfo,
      ...normalizeGuestBuyer(guestInfo),
      shippingMethod: resolvedShippingMethod,
    };

    const liveLocationReady =
      typeof deliveryInfo.latitude === "number" &&
      typeof deliveryInfo.longitude === "number" &&
      Boolean(deliveryInfo.formattedAddress || deliveryInfo.addressLine);

    if (buyer && shippable && requiresAddress && addresses.length > 0 && !liveLocationReady) {
      if (!selectedAddressId) {
        applyDeliveryFieldErrors(
          { savedAddress: CHECKOUT_ERRORS.savedAddressRequired },
          CHECKOUT_ERRORS.savedAddressRequired,
        );
        return;
      }
    } else {
      const nextFieldErrors = validateGuestDeliveryFields(deliveryInfo, requiresAddress);
      if (Object.keys(nextFieldErrors).length > 0) {
        applyDeliveryFieldErrors(nextFieldErrors);
        return;
      }
    }

    setGuestInfo(deliveryInfo);

    transitionLockRef.current = true;
    setIsContinuing(true);
    try {
      advanceStep("payment");
    } finally {
      setIsContinuing(false);
      transitionLockRef.current = false;
    }
  }

  async function handlePay(options?: { forceMock?: boolean }) {
    if (!listing || !totals) return;
    setError("");
    setIsLoading(true);
    try {
      const sessionUser = getSessionSnapshot();
      const normalized = normalizeGuestBuyer(guestInfo);
      const isGuest = guestCheckout && !sessionUser;
      const deliveryInfo: GuestDeliveryInfo = {
        ...guestInfo,
        ...normalized,
        shippingMethod: resolvedShippingMethod,
      };

      if (isGuest) {
        const nextFieldErrors = validateGuestDeliveryFields(deliveryInfo, requiresAddress);
        if (Object.keys(nextFieldErrors).length > 0) {
          setStep("delivery");
          applyDeliveryFieldErrors(nextFieldErrors);
          return;
        }
      } else if (!sessionUser) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      const selectedAddress = addresses.find((item) => item.id === selectedAddressId);
      const useLiveLocation =
        typeof deliveryInfo.latitude === "number" &&
        typeof deliveryInfo.longitude === "number";

      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          isGuest,
          forceMock: options?.forceMock === true,
          buyer: {
            id: sessionUser?.id,
            email: sessionUser?.email ?? normalized.email,
            fullName: sessionUser?.fullName ?? normalized.fullName,
            phone: sessionUser?.phone?.trim() || normalized.phone,
            role: sessionUser?.role,
          },
          localListing: listing.id.startsWith("local-")
            ? {
                id: listing.id,
                slug: listing.slug,
                title: listing.title,
                price: listing.price,
                categoryId: listing.categoryId,
                emirate: listing.emirate,
                city: listing.city,
                seller: { id: listing.seller.id, name: listing.seller.name },
              }
            : undefined,
          shippingMethod: shippable ? resolvedShippingMethod : undefined,
          shippingFee: shippable ? shippingFee : 0,
          addressId:
            sessionUser && selectedAddressId && !useLiveLocation ? selectedAddressId : undefined,
          deliveryAddress:
            requiresAddress && (useLiveLocation || !sessionUser || !selectedAddress)
              ? buildDeliveryAddressInput(deliveryInfo, normalized)
              : undefined,
          repurchasedFromOrderId: fromOrderId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(formatCheckoutApiError(data));
        return;
      }

      if (data.mode === "mock" && data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      }
    } catch {
      setError(LISTING_ERRORS.paymentFailed);
    } finally {
      setIsLoading(false);
    }
  }

  if (!listing) {
    return (
      <LocalizedTree>
      <section className="app-container page-padding">
        <FormMessage variant="error">{LISTING_ERRORS.listingUnavailable}</FormMessage>
      </section>
      </LocalizedTree>
    );
  }

  const backHref = listing.id.startsWith("local-")
    ? `/listings/local/${listing.id}`
    : `/listings/${listing.slug}`;

  const showDeliveryStep =
    shippable || (guestCheckout && !sessionUser);

  const steps: CheckoutStep[] = ["review"];
  if (showDeliveryStep) steps.push("delivery");
  steps.push("payment");

  const mockCheckoutEnabled = isMockCheckoutEnabled();

  return (
    <LocalizedTree>
    <section className="app-container page-padding">
      <PageHero
        description="خطوات سريعة وآمنة لإتمام الشراء عبر الضمان المالي."
        eyebrow="الدفع"
        title="إتمام الشراء"
      />

      <div className="mx-auto mt-6 max-w-3xl" ref={panelRef}>
        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((item, index) => (
            <Badge key={item} variant={step === item ? "premium" : "muted"}>
              {index + 1}.{" "}
              {item === "review"
                ? "مراجعة الطلب"
                : item === "delivery"
                  ? "التوصيل والتواصل"
                  : "الدفع"}
            </Badge>
          ))}
        </div>

        {paymentCancelled ? (
          <FormMessage variant="error">تم إلغاء الدفع. يمكنك المحاولة مرة أخرى.</FormMessage>
        ) : null}
        {fromOrderId ? (
          <p className="mb-4 rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-ink">
            إعادة شراء بالسعر الحالي للإعلان. سيتم إنشاء طلب جديد دون تعديل الطلب السابق.
          </p>
        ) : null}
        {error ? <FormMessage variant="error">{error}</FormMessage> : null}

        {step === "review" ? (
          <Card className="p-6" variant="flat">
            <div className="flex gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius-xl)]">
                <AppImage
                  alt={displayTitle}
                  className="object-cover"
                  fallbackCategory={listing.categoryId}
                  fill
                  sizes="96px"
                  src={getListingImageUrl(listing)}
                />
              </div>
              <div>
                <h2 className="font-black text-ink">
                  <ListingTitle listing={listing} />
                </h2>
                <p className="mt-1 text-sm text-muted">
                  <SellerName seller={listing.seller} />
                </p>
                <div className="mt-2">
                  <CurrencyAmount amount={listing.price} size="lg" />
                </div>
                {showsEscrowProtection(listing) ? (
                  <Badge className="mt-2" variant="escrow">
                    ضمان مالي — دفع عبر المنصة
                  </Badge>
                ) : null}
              </div>
            </div>
            {guestCheckout && !sessionUser ? (
              <p className="mt-4 text-sm text-muted">
                يمكنك إتمام الشراء كضيف دون تسجيل الدخول.
              </p>
            ) : null}
            <div className="mt-6 flex gap-2">
              <Button
                loading={isContinuing}
                onClick={handleContinueFromReview}
                type="button"
                variant="accent"
              >
                متابعة
              </Button>
              <Button href={backHref} type="button" variant="secondary">
                إلغاء
              </Button>
            </div>
          </Card>
        ) : null}

        {step === "delivery" && showDeliveryStep ? (
          <Card className="grid gap-4 p-6" variant="flat">
            <h3 className="font-black text-ink">بيانات المشتري</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                error={fieldErrors.fullName}
                label="الاسم الكامل"
                name="fullName"
                onChange={(event) => {
                  setGuestInfo((prev) => ({ ...prev, fullName: event.target.value }));
                  setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                required
                value={guestInfo.fullName}
              />
              <Input
                error={fieldErrors.email}
                label="البريد الإلكتروني"
                name="email"
                onBlur={() => checkEmailExists(guestInfo.email)}
                onChange={(event) => {
                  setGuestInfo((prev) => ({ ...prev, email: event.target.value }));
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                required
                type="email"
                value={guestInfo.email}
              />
              <Input
                dir="ltr"
                error={fieldErrors.phone}
                inputMode="tel"
                label="رقم الجوال"
                name="phone"
                onChange={(event) => {
                  setGuestInfo((prev) => ({ ...prev, phone: event.target.value }));
                  setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                required
                type="tel"
                value={guestInfo.phone}
              />
            </div>
            {existingAccountHint ? (
              <FormMessage variant="success">
                يمكنك متابعة الشراء. إذا كان لديك حساب سابق، يمكنك تسجيل الدخول لاحقًا لمتابعة
                جميع طلباتك.
              </FormMessage>
            ) : null}

            {shippable ? (
              <>
                <h3 className="font-black text-ink">طريقة التوصيل</h3>
                <div className="grid gap-2">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center justify-between rounded-[var(--radius-xl)] border px-4 py-3 ${resolvedShippingMethod === method.id ? "border-secondary bg-secondary-soft" : "border-border"}`}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{method.label}</span>
                        <span className="text-xs text-muted">{method.description}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <CurrencyAmount amount={method.fee} size="sm" />
                        <input
                          checked={resolvedShippingMethod === method.id}
                          name="shipping"
                          onChange={() => setShippingMethod(method.id)}
                          type="radio"
                        />
                      </span>
                    </label>
                  ))}
                </div>

                {requiresAddress ? (
                  <>
                    <h3 className="font-black text-ink">عنوان التوصيل</h3>
                    <CheckoutLiveLocation
                      confirmed={
                        hasLiveLocation
                          ? {
                              latitude: guestInfo.latitude as number,
                              longitude: guestInfo.longitude as number,
                              formattedAddress: guestInfo.formattedAddress || guestInfo.addressLine || "",
                              emirate: guestInfo.emirate || "",
                              city: guestInfo.city || guestInfo.emirate || "",
                              area: guestInfo.area || guestInfo.addressLine || "",
                            }
                          : null
                      }
                      onConfirm={(value: CheckoutLiveLocationValue) => {
                        setGuestInfo((prev) => ({
                          ...prev,
                          emirate: value.emirate || prev.emirate,
                          addressLine: value.formattedAddress,
                          city: value.city,
                          area: value.area,
                          latitude: value.latitude,
                          longitude: value.longitude,
                          formattedAddress: value.formattedAddress,
                        }));
                        setFieldErrors((prev) => ({
                          ...prev,
                          emirate: undefined,
                          addressLine: undefined,
                          savedAddress: undefined,
                        }));
                      }}
                    />
                    {sessionUser && addresses.length > 0 && !hasLiveLocation ? (
                      <Select
                        error={fieldErrors.savedAddress}
                        label="عنوان محفوظ"
                        name="addressId"
                        onChange={(event) => {
                          setSelectedAddressId(event.target.value);
                          setFieldErrors((prev) => ({ ...prev, savedAddress: undefined }));
                        }}
                        options={addresses.map((item) => ({
                          label: `${item.label} — ${item.area}`,
                          value: item.id,
                        }))}
                        value={selectedAddressId}
                      />
                    ) : null}
                    {(!sessionUser || addresses.length === 0 || hasLiveLocation) && (
                      <div className="grid gap-3">
                        <Select
                          error={fieldErrors.emirate}
                          label="الإمارة"
                          name="emirate"
                          onChange={(event) => {
                            setGuestInfo((prev) => ({ ...prev, emirate: event.target.value }));
                            setFieldErrors((prev) => ({ ...prev, emirate: undefined }));
                          }}
                          options={cities.map((city) => ({ label: city.name, value: city.name }))}
                          required
                          value={guestInfo.emirate}
                        />
                        <Input
                          error={fieldErrors.addressLine}
                          label="عنوان التوصيل"
                          name="addressLine"
                          onChange={(event) => {
                            setGuestInfo((prev) => ({ ...prev, addressLine: event.target.value }));
                            setFieldErrors((prev) => ({ ...prev, addressLine: undefined }));
                          }}
                          placeholder="مثال: الخليج التجاري، برج الإمارات، الطابق 12"
                          required
                          value={guestInfo.addressLine}
                        />
                        {sessionUser ? (
                          <label className="flex items-center gap-2 text-sm text-muted">
                            <input
                              checked={guestInfo.saveAddress}
                              onChange={(event) =>
                                setGuestInfo((prev) => ({
                                  ...prev,
                                  saveAddress: event.target.checked,
                                }))
                              }
                              type="checkbox"
                            />
                            حفظ العنوان
                          </label>
                        ) : null}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    الاستلام من البائع — لا يلزم إدخال عنوان توصيل كامل.
                  </p>
                )}
              </>
            ) : null}

            <div className="sticky bottom-0 z-10 -mx-2 flex gap-2 border-t border-border bg-surface/95 p-4 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/90 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              <Button
                className="flex-1 md:flex-none"
                loading={isContinuing}
                onClick={handleContinueFromDelivery}
                type="button"
                variant="accent"
              >
                متابعة للدفع
              </Button>
              <Button onClick={() => advanceStep("review")} type="button" variant="secondary">
                رجوع
              </Button>
            </div>
          </Card>
        ) : null}

        {step === "payment" && totals ? (
          <Card className="grid gap-4 p-6" variant="flat">
            <h3 className="font-black text-ink">ملخص الدفع</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">سعر المنتج</span>
                <CurrencyAmount amount={totals.productPrice} size="sm" />
              </div>
              {shippable ? (
                <div className="flex justify-between">
                  <span className="text-muted">التوصيل</span>
                  <CurrencyAmount amount={totals.shippingFee} size="sm" />
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted">رسوم المنصة</span>
                <CurrencyAmount amount={totals.platformFee} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted">رسوم الدفع</span>
                <CurrencyAmount amount={totals.gatewayFee} size="sm" />
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-bold">الإجمالي</span>
                <CurrencyAmount amount={totals.total} size="lg" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                loading={isLoading}
                onClick={() => handlePay()}
                type="button"
                variant="accent"
              >
                تأكيد الدفع
              </Button>
              {mockCheckoutEnabled ? (
                <Button
                  loading={isLoading}
                  onClick={() => handlePay({ forceMock: true })}
                  type="button"
                  variant="secondary"
                >
                  إتمام تجريبي
                </Button>
              ) : null}
              <Button
                onClick={() => advanceStep(showDeliveryStep ? "delivery" : "review")}
                type="button"
                variant="secondary"
              >
                رجوع
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </section>
    </LocalizedTree>
  );
}
