"use client";

import type { Category, Listing } from "@/types";
import { ListingPrimaryAction } from "@/features/listings/components/ListingPrimaryAction";
import { getListingActionConfig } from "@/shared/constants/listingActionConfig";
import { formatPostedTime } from "@/features/listings/components/listing-card.utils";
import { StartChatButton } from "@/features/chat/components/StartChatButton";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { FavoriteButton } from "@/shared/components/FavoriteButton";
import { ShareButton } from "@/shared/components/ShareButton";
import { ListingTitle } from "@/shared/i18n/ListingTitle";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { showsEscrowProtection } from "@/shared/listings/escrow-eligibility";
import {
  isShowcaseListing,
  showsListingCondition,
} from "@/shared/listings/showcase-listing";

type ListingSummaryProps = {
  category?: Category;
  listing: Listing;
};

const conditionVariants: Record<Listing["condition"], "new" | "muted" | "premium"> = {
  excellent: "premium",
  new: "new",
  used: "muted",
};

const conditionLabels: Record<Listing["condition"], string> = {
  excellent: "ممتاز",
  new: "جديد",
  used: "مستعمل",
};

export function ListingSummary({ category, listing }: ListingSummaryProps) {
  const config = getListingActionConfig(listing);
  const locationLabel = listing.area
    ? `${listing.area}، ${listing.emirate ?? listing.city}`
    : listing.emirate
      ? `${listing.city}، ${listing.emirate}`
      : listing.city;

  return (
    <LocalizedTree>
    <Card className="marketplace-panel p-6 lg:sticky lg:top-24 lg:self-start">
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

      <h1 className="mt-4 text-2xl font-black leading-tight text-ink md:text-3xl">
        <ListingTitle listing={listing} />
      </h1>

      <div className="mt-4">
        <CurrencyAmount amount={listing.price} size="xl" />
      </div>

      <div className="mt-6 grid gap-3 text-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-medium text-muted">الموقع</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <Icon name="map" size={14} />
            {locationLabel}
          </span>
        </div>
        {listing.postedAt ? (
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="font-medium text-muted">تاريخ النشر</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <Icon name="clock" size={14} />
              {formatPostedTime(listing.postedAt)}
            </span>
          </div>
        ) : null}
        {listing.views > 0 ? (
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted">المشاهدات</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <Icon name="eye" size={14} />
              {listing.views.toLocaleString("ar-AE")}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-2">
        <ListingPrimaryAction action={config.primaryAction} listing={listing} />
        {config.primaryAction === "SEND_MESSAGE" ? null : (
          <StartChatButton fullWidth listing={listing} size="lg" />
        )}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <FavoriteButton className="w-full" listing={listing} />
        <ShareButton className="w-full" listing={listing} />
      </div>
    </Card>
    </LocalizedTree>
  );
}
