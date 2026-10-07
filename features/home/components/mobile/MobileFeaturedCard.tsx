"use client";

import Link from "next/link";
import { memo } from "react";
import type { Listing } from "@/types";
import { AppImage } from "@/shared/components/AppImage";
import { FavoriteButton } from "@/shared/components/FavoriteButton";
import { ListingTitle } from "@/shared/i18n/ListingTitle";
import { FeaturedBadge } from "@/features/listings/components/FeaturedBadge";
import { ListingCardBadges } from "@/features/listings/components/ListingCardBadges";
import { isListingFeaturedActive } from "@/features/listings/components/listing-card-badges";
import { ListingPrice } from "@/shared/components/ListingPrice";
import { Icon } from "@/shared/ui/Icon";
import {
  formatPostedTime,
  formatViews,
  getListingHref,
  getListingImageUrl,
  getListingImages,
  getListingLocation,
} from "@/features/listings/components/listing-card.utils";
import { useLocale } from "@/shared/i18n/useLocale";
import { intlLocale } from "@/shared/i18n/locale";
import { useTx } from "@/shared/i18n/useTx";

import "@/features/listings/components/featured-badge.css";

type MobileFeaturedCardProps = {
  listing: Listing;
  priority?: boolean;
};

export const MobileFeaturedCard = memo(function MobileFeaturedCard({
  listing,
  priority = false,
}: MobileFeaturedCardProps) {
  const locale = useLocale();
  const t = useTx();
  const href = getListingHref(listing);
  const imageUrl = getListingImageUrl(listing);
  const location = getListingLocation(listing);
  const photoCount = getListingImages(listing).length;
  const featuredLive = isListingFeaturedActive(listing);

  return (
    <article
      className={`mobile-home-featured-card w-[var(--mh-card-width)] min-w-[10.75rem] max-w-[13rem] shrink-0 flex-none snap-start overflow-hidden ${
        featuredLive ? "mobile-home-featured-card--featured" : ""
      }`.trim()}
    >
      <div className="mobile-home-featured-card__media">
        <Link aria-hidden className="absolute inset-0" href={href} tabIndex={-1}>
          {imageUrl ? (
            <AppImage
              alt=""
              className="mobile-home-featured-card__image object-cover"
              fallback="none"
              fill
              loading={priority ? undefined : "lazy"}
              priority={priority}
              sizes="280px"
              src={imageUrl}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-muted text-xs font-semibold text-muted">
              لا توجد صورة
            </div>
          )}
        </Link>

        <ListingCardBadges
          className="!start-2 !top-2"
          excludeFeatured
          listing={listing}
        />

        {photoCount > 0 ? (
          <span className="mobile-home-featured-card__photo-count">
            <Icon name="photo" size={12} />
            {photoCount}
          </span>
        ) : null}
      </div>

      <div className="mobile-home-featured-card__body">
        {featuredLive ? (
          <div className="mb-1.5">
            <FeaturedBadge placement="chip" size="sm" />
          </div>
        ) : null}
        <p className="mobile-home-featured-card__price">
          <ListingPrice listing={listing} size="sm" />
        </p>

        <Link href={href}>
          <h3 className="mobile-home-featured-card__title">
            <ListingTitle listing={listing} />
          </h3>
        </Link>

        <p className="mobile-home-featured-card__meta">
          {t(location)} • {t(formatPostedTime(listing.postedAt))}
        </p>

        <div className="mobile-home-featured-card__footer">
          {(listing.views ?? 0) > 0 ? (
            <span className="mobile-home-featured-card__views">
              <Icon name="eye" size={12} />
              {formatViews(listing.views ?? 0, locale)}
            </span>
          ) : (
            <span />
          )}
          <FavoriteButton
            className="!min-h-7 !size-7 !min-w-7 !rounded-full !border-0 !bg-transparent !p-0 !shadow-none text-muted"
            iconOnly
            listing={listing}
          />
        </div>
      </div>
    </article>
  );
});
