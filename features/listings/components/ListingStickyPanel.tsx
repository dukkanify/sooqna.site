"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import type { Category, Listing } from "@/types";
import { ListingPrimaryAction } from "@/features/listings/components/ListingPrimaryAction";
import { SellerContactActions } from "@/features/listings/components/ListingPrimaryAction";
import { FavoriteButton } from "@/shared/components/FavoriteButton";
import { ShareButton } from "@/shared/components/ShareButton";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { ListingTitle } from "@/shared/i18n/ListingTitle";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useToast } from "@/shared/components/ToastProvider";
import {
  getListingActionConfig,
  getListingActionLabel,
  type ListingActionType,
} from "@/shared/constants/listingActionConfig";
import { isGuestCheckoutEnabled } from "@/shared/constants/feature-flags";
import { LISTING_ERRORS } from "@/shared/constants/listing-errors";
import { showsEscrowProtection } from "@/shared/listings/escrow-eligibility";
import { isOwnListing } from "@/shared/listings/listing-ownership";
import { isPublicListingStatus } from "@/shared/constants/listingStatuses";
import { getCheckoutPath, getListingCanonicalUrl } from "@/shared/listings/listing-url";
import {
  getTelHref,
  getWhatsAppHref,
} from "@/shared/listings/listing-contact";
import {
  isShowcaseListing,
  showsListingCondition,
} from "@/shared/listings/showcase-listing";
import { getCarKeySpecRows } from "@/shared/listings/listing-specs";
import { formatPostedTime } from "@/features/listings/components/listing-card.utils";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { StartChatButton } from "@/features/chat/components/StartChatButton";
import { getSessionSnapshot, subscribeSession } from "@/services/storage/external-store";
import { getSessionUser } from "@/services/storage";
import "./mobile-sticky-action-bar.css";

type ListingStickyPanelProps = {
  category?: Category;
  listing: Listing;
};

const conditionVariants: Record<Listing["condition"], "new" | "muted" | "premium"> = {
  excellent: "premium",
  new: "new",
  used: "muted",
  refurbished: "premium",
  for_parts: "muted",
  not_working: "muted",
};

const conditionLabels: Record<Listing["condition"], string> = {
  excellent: "ممتاز",
  new: "جديد",
  used: "مستعمل",
  refurbished: "مجدّد",
  for_parts: "للقطع",
  not_working: "لا يعمل",
};

export function ListingStickyPanel({ category, listing }: ListingStickyPanelProps) {
  const config = getListingActionConfig(listing);
  const user = typeof window !== "undefined" ? getSessionUser() : null;
  const isOwn = user ? isOwnListing(listing, user) : false;
  const canTransact = isPublicListingStatus(listing.status) && !isOwn;

  const locationLabel = listing.area
    ? `${listing.area}، ${listing.emirate ?? listing.city}`
    : listing.emirate
      ? `${listing.city}، ${listing.emirate}`
      : listing.city;

  return (
    <LocalizedTree>
    <Card className="marketplace-panel w-full min-w-0 p-6">
        <div className="flex flex-wrap items-center gap-2">
        {isShowcaseListing(listing) ? (
          <Badge variant="demo">إعلان تجريبي</Badge>
        ) : null}
        {category ? <Badge variant="muted">{category.name}</Badge> : null}
        {showsListingCondition(listing) ? (
          <Badge variant={conditionVariants[listing.condition]}>
            {conditionLabels[listing.condition]}
          </Badge>
        ) : null}
        {showsEscrowProtection(listing) ? (
          <Badge variant="escrow">ضمان مالي — دفع عبر المنصة</Badge>
        ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-black leading-tight text-ink"><ListingTitle listing={listing} /></h1>
        <div className="mt-4">
          {listing.categoryId === "jobs" ? (
            <p className="text-2xl font-black text-ink">
              {String(listing.categorySpecs?.salary ?? "").trim() ||
                "الراتب حسب الاتفاق"}
            </p>
          ) : (
            <CurrencyAmount amount={listing.price} size="xl" />
          )}
          {listing.negotiable && listing.categoryId !== "jobs" ? (
            <p className="mt-1 text-sm font-semibold text-secondary">قابل للتفاوض</p>
          ) : null}
        </div>

        {listing.categoryId === "cars" ? (
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {getCarKeySpecRows(listing).map((row) => (
              <li
                key={row.label}
                className="rounded-xl border border-border/80 bg-surface-muted/50 px-3 py-2"
              >
                <p className="text-[0.65rem] font-bold text-muted">{row.label}</p>
                <p className="mt-0.5 text-sm font-bold text-ink">{row.value}</p>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <span className="shrink-0 font-medium text-muted">الموقع</span>
          <span className="min-w-0 text-end inline-flex items-center gap-1.5 font-semibold text-ink">
            <Icon name="map" size={14} />
            {locationLabel}
          </span>
        </div>
        {listing.postedAt ? (
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted">تاريخ النشر</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <Icon name="clock" size={14} />
              {formatPostedTime(listing.postedAt)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-2">
        {canTransact ? (
          <ListingPrimaryAction action={config.primaryAction} listing={listing} />
        ) : null}
        {canTransact ? (
          <SellerContactActions
            hideChat={
              config.primaryAction === "CONTACT_SELLER" ||
              config.primaryAction === "SEND_MESSAGE"
            }
            listing={listing}
            stacked
          />
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <FavoriteButton className="w-full" listing={listing} />
        <ShareButton className="w-full" listing={listing} />
      </div>
    </Card>
    </LocalizedTree>
  );
}

type MobileStickyActionBarProps = {
  listing: Listing;
};

function MobileContactIconButton({
  ariaLabel,
  children,
  className = "",
  external = false,
  href,
  onClick,
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const classes = `focus-ring mobile-sticky-bar__icon ${className}`.trim();

  if (href) {
    return (
      <a
        aria-label={ariaLabel}
        className={classes}
        href={href}
        {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button aria-label={ariaLabel} className={classes} onClick={onClick} type="button">
      {children}
    </button>
  );
}

/** Primary intents that need a visible CTA on mobile (desktop sticky panel parity). */
const MOBILE_PRIMARY_CTA_ACTIONS = new Set<ListingActionType>([
  "APPLY_JOB",
  "BOOK_SERVICE",
  "BOOK_VIEWING",
  "BUY_NOW",
  "CONTACT_SELLER",
  "REQUEST_QUOTE",
  "RESERVE",
]);

export function MobileStickyActionBar({ listing }: MobileStickyActionBarProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const config = getListingActionConfig(listing);
  const user = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const isOwn = user ? isOwnListing(listing, user) : false;
  const canTransact = isPublicListingStatus(listing.status) && !isOwn;
  const tel = getTelHref(listing);
  const whatsapp = getWhatsAppHref(listing, getListingCanonicalUrl(listing));
  const primaryLabel = getListingActionLabel(listing, config.primaryAction);
  const showGoldCta =
    canTransact && MOBILE_PRIMARY_CTA_ACTIONS.has(config.primaryAction);
  const showContactIcons = canTransact;
  const hideChatIcon =
    config.primaryAction === "CONTACT_SELLER" ||
    config.primaryAction === "SEND_MESSAGE";
  const isCheckoutCta =
    config.primaryAction === "BUY_NOW" || config.primaryAction === "RESERVE";

  if (!canTransact) {
    return null;
  }

  function handleBuyNow() {
    if (listing.status !== "active") {
      showToast(LISTING_ERRORS.listingUnavailable, "error");
      return;
    }
    const sessionUser = getSessionUser();
    if (sessionUser && isOwnListing(listing, sessionUser)) {
      showToast(LISTING_ERRORS.ownListing, "error");
      return;
    }
    const checkoutPath = getCheckoutPath(listing);
    if (!isGuestCheckoutEnabled() && !sessionUser) {
      router.push(`/login?next=${encodeURIComponent(checkoutPath)}`);
      return;
    }
    router.push(checkoutPath);
  }

  return (
    <LocalizedTree>
    <div className="mobile-sticky-bar">
      <div
        className={`mobile-sticky-bar__inner${showGoldCta ? "" : " mobile-sticky-bar__inner--icons-only"}`}
      >
        {showGoldCta ? (
          isCheckoutCta ? (
            <button
              className="focus-ring mobile-sticky-bar__cta"
              onClick={handleBuyNow}
              type="button"
            >
              <Icon name="package" size={18} />
              {primaryLabel}
            </button>
          ) : (
            <ListingPrimaryAction
              action={config.primaryAction}
              className="mobile-sticky-bar__cta"
              listing={listing}
              size="md"
              variant="accent"
            />
          )
        ) : null}

        {showContactIcons ? (
          <div className="mobile-sticky-bar__actions">
            {hideChatIcon ? null : (
              <StartChatButton
                className="mobile-sticky-bar__icon mobile-sticky-bar__icon--chat"
                layout="icon"
                listing={listing}
                size="sm"
                variant="ghost"
              />
            )}

            {whatsapp ? (
              <MobileContactIconButton
                ariaLabel="مراسلة عبر واتساب"
                className="mobile-sticky-bar__icon--whatsapp"
                external
                href={whatsapp}
              >
                <Icon name="whatsapp" size={20} />
              </MobileContactIconButton>
            ) : null}

            {tel ? (
              <MobileContactIconButton
                ariaLabel="اتصال بالبائع"
                className="mobile-sticky-bar__icon--call"
                href={tel}
              >
                <Icon name="phone-call" size={19} />
              </MobileContactIconButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
    </LocalizedTree>
  );
}
