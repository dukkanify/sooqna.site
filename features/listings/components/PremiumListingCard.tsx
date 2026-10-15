"use client";

import Link from "next/link";
import { memo } from "react";
import type { Listing } from "@/types";
import { AppImage } from "@/shared/components/AppImage";
import { ListingPrice } from "@/shared/components/ListingPrice";
import { ListingTitle } from "@/shared/i18n/ListingTitle";
import { listingTitle } from "@/shared/i18n/listing-copy";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocale } from "@/shared/i18n/useLocale";
import { showsEscrowProtection } from "@/shared/listings/escrow-eligibility";
import { getCarCardMetaLine } from "@/shared/listings/listing-specs";
import { Icon } from "@/shared/ui/Icon";
import { FeaturedBadge } from "./FeaturedBadge";
import { ListingMachineHint } from "./ListingMachineHint";
import { ListingCardBadges } from "./ListingCardBadges";
import { isListingFeaturedActive } from "./listing-card-badges";
import {
  getListingHref,
  getListingCardImageUrl,
  getListingLocation,
  formatPostedTime,
  formatViews,
} from "./listing-card.utils";

import "./featured-badge.css";

export type PremiumListingCardProps = {
  categoryName?: string;
  layout?: "card" | "row";
  listing: Listing;
  priority?: boolean;
  showStatus?: boolean;
};

/**
 * Browse card: photo + title + price + one meta line.
 * Favorite/share stay on the listing detail page so the grid stays scannable.
 */
export const PremiumListingCard = memo(function PremiumListingCard({
  categoryName,
  layout = "card",
  listing,
  priority = false,
  showStatus = false,
}: PremiumListingCardProps) {
  const locale = useLocale();
  const href = getListingHref(listing);
  const imageUrl = getListingCardImageUrl(listing);
  const location = getListingLocation(listing);
  const displayTitle = listingTitle(listing, locale);

  const showEscrow = showsEscrowProtection(listing);
  const featuredLive = isListingFeaturedActive(listing);
  const views = listing.views ?? 0;
  const carMeta = listing.categoryId === "cars" ? getCarCardMetaLine(listing) : null;

  const imageArea = (
    <div
      className={`marketplace-card-media relative aspect-[3/2] w-full overflow-hidden ${layout === "row" ? "marketplace-card-media--row" : ""}`}
    >
      {imageUrl ? (
        <AppImage
          alt=""
          className="marketplace-card-image"
          fallback="none"
          fill
          loading={priority ? undefined : "lazy"}
          priority={priority}
          sizes={
            layout === "row"
              ? "144px"
              : "(max-width: 1024px) 50vw, 25vw"
          }
          src={imageUrl}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-surface-muted text-xs font-semibold text-muted"
        >
          لا توجد صورة
        </div>
      )}

      {featuredLive ? (
        <div className="marketplace-card-crown pointer-events-none">
          <FeaturedBadge placement="cap" />
        </div>
      ) : null}
    </div>
  );

  const bodyBlock = (
    <div
      className={`flex min-w-0 flex-col ${layout === "card" ? "gap-0.5 p-2.5 sm:p-3" : "justify-center gap-1 p-3 md:p-4"}`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {categoryName ? (
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[#B8955F]">
            {categoryName}
          </p>
        ) : null}
        <ListingCardBadges excludeFeatured inline listing={listing} />
        {showStatus && listing.status !== "active" ? (
          <span className="text-[0.65rem] font-semibold text-muted">
            {listing.status}
          </span>
        ) : null}
      </div>

      <h3 className="marketplace-card-title line-clamp-2 break-words text-xs font-bold leading-snug text-ink transition group-hover:text-secondary sm:text-sm">
        <ListingTitle listing={listing} />
      </h3>
      <ListingMachineHint className="w-fit" listing={listing} />

      {carMeta ? (
        <p className="text-[0.7rem] font-medium text-muted">{carMeta}</p>
      ) : null}

      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <ListingPrice listing={listing} size="sm" />
        {showEscrow ? (
          <span className="inline-flex items-center gap-0.5 text-[0.65rem] font-bold text-emerald-700">
            <Icon name="shield" size={11} />
            ضمان مالي
          </span>
        ) : null}
      </div>

      <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.65rem] font-medium text-muted sm:text-xs">
        <span className="inline-flex min-w-0 items-center gap-0.5">
          <Icon className="shrink-0" name="map" size={11} />
          <span className="min-w-0 truncate">{location}</span>
        </span>
        {listing.postedAt ? (
          <>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap">
              <Icon className="marketplace-card-meta-icon" name="clock" size={11} />
              {formatPostedTime(listing.postedAt)}
            </span>
          </>
        ) : null}
        {views > 0 ? (
          <>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap"
              title={`${formatViews(views, locale)} مشاهدة`}
            >
              <Icon className="marketplace-card-meta-icon" name="eye" size={11} />
              {formatViews(views, locale)}
            </span>
          </>
        ) : null}
      </p>
    </div>
  );

  const cardClass = `marketplace-card group relative ${
    featuredLive ? "marketplace-card--featured" : ""
  }`.trim();

  const stretchedLink = (
    <Link
      aria-label={displayTitle}
      className="marketplace-card-stretched-link absolute inset-0 z-0"
      href={href}
    />
  );

  if (layout === "row") {
    return (
      <LocalizedTree>
        <article className={`${cardClass} flex flex-col overflow-hidden`}>
          {stretchedLink}
          <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 overflow-hidden">
            <div className="relative w-28 shrink-0 sm:w-36">{imageArea}</div>
            <div className="flex min-w-0 flex-1 flex-col">{bodyBlock}</div>
          </div>
        </article>
      </LocalizedTree>
    );
  }

  return (
    <LocalizedTree>
      <article className={`${cardClass} flex h-auto flex-col self-start`}>
        {stretchedLink}
        <div className="pointer-events-none relative z-10 flex flex-col">
          {imageArea}
          {bodyBlock}
        </div>
      </article>
    </LocalizedTree>
  );
});
