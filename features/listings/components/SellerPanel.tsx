"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Listing } from "@/types";
import { AppImage } from "@/shared/components/AppImage";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { SellerName } from "@/shared/i18n/SellerName";
import { sellerName } from "@/shared/i18n/listing-copy";
import { useLocale } from "@/shared/i18n/useLocale";
import { getSellerHref } from "@/shared/listings/seller-href";
import { isShowcaseListing } from "@/shared/listings/showcase-listing";
import { FollowSellerButton } from "@/features/listings/components/FollowSellerButton";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";

type SellerPanelProps = {
  listing: Listing;
};

function formatJoinedDate(joinedAt: string): string {
  const year = new Date(joinedAt).getFullYear();
  return Number.isFinite(year) ? String(year) : joinedAt;
}

export function SellerPanel({ listing }: SellerPanelProps) {
  const locale = useLocale();
  const displaySeller = sellerName(listing.seller, locale);
  const sellerHref = getSellerHref(listing.seller.id);

  const [storeAverage, setStoreAverage] = useState<number | null>(null);
  const [storeCount, setStoreCount] = useState<number | null>(null);

  useEffect(() => {
    if (isShowcaseListing(listing)) return;
    let cancelled = false;
    fetch(`/api/sellers/${encodeURIComponent(listing.seller.id)}/ratings`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.average === "number" && data.count > 0) {
          setStoreAverage(data.average);
          setStoreCount(data.count);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [listing]);

  const rating = storeAverage;
  const reviewCount = storeCount;

  const showRating =
    typeof rating === "number" && rating > 0 && (storeCount ?? 0) > 0;
  const showReviews = typeof reviewCount === "number" && reviewCount > 0;
  const showCompany = listing.seller.sellerType === "business";
  const showResponseTime = Boolean(listing.seller.responseTime?.trim());
  const showJoinedAt = Boolean(listing.seller.joinedAt?.trim());
  const showTransactions =
    typeof listing.seller.completedTransactions === "number" &&
    listing.seller.completedTransactions > 0;

  return (
    <LocalizedTree>
      <Card className="marketplace-panel w-full min-w-0 p-6">
        <h2 className="text-base font-black text-ink">البائع</h2>
        <Link
          className="group mt-4 flex items-center gap-3 rounded-[var(--radius-xl)] outline-offset-2 transition hover:bg-surface-muted/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
          href={sellerHref}
        >
          {listing.seller.avatarUrl ? (
            <span className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-xl)]">
              <AppImage
                alt={displaySeller}
                className="object-cover"
                fallback="avatar"
                fill
                sizes="48px"
                src={listing.seller.avatarUrl}
              />
            </span>
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-xl)] bg-primary text-sm font-semibold text-white">
              {displaySeller.slice(0, 2)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink underline-offset-2 group-hover:underline">
              <SellerName seller={listing.seller} />
            </p>
            {showRating ? (
              <p className="mt-0.5 inline-flex flex-wrap items-center gap-1 text-sm font-medium text-muted">
                <Icon className="text-secondary" name="star" size={14} />
                {rating}
                {showReviews ? (
                  <>
                    <span className="text-border">·</span>
                    {reviewCount!.toLocaleString("en-AE")} تقييم
                  </>
                ) : null}
              </p>
            ) : null}
            {showCompany ? (
              <p className="mt-0.5 text-xs font-medium text-muted">شركة</p>
            ) : null}
            <p className="mt-1 text-xs font-bold text-secondary">
              عرض كل إعلانات البائع
            </p>
          </div>
          <Icon className="shrink-0 text-muted" name="chevron-left" size={16} />
        </Link>

        <div className="mt-4">
          <FollowSellerButton className="w-full" sellerId={listing.seller.id} />
        </div>

        {showResponseTime || showJoinedAt || showTransactions ? (
          <div className="mt-5 grid gap-2 text-sm">
            {showResponseTime ? (
              <div className="flex items-center justify-between rounded-[var(--radius-xl)] bg-surface-muted px-4 py-3">
                <span className="font-medium text-muted">الرد</span>
                <span className="font-semibold text-ink">
                  {listing.seller.responseTime}
                </span>
              </div>
            ) : null}
            {showJoinedAt ? (
              <div className="flex items-center justify-between rounded-[var(--radius-xl)] bg-surface-muted px-4 py-3">
                <span className="font-medium text-muted">عضو منذ</span>
                <span className="font-semibold text-ink">
                  {formatJoinedDate(listing.seller.joinedAt!)}
                </span>
              </div>
            ) : null}
            {showTransactions ? (
              <div className="flex items-center justify-between rounded-[var(--radius-xl)] bg-surface-muted px-4 py-3">
                <span className="font-medium text-muted">معاملات مكتملة</span>
                <span className="font-semibold text-ink">
                  {listing.seller.completedTransactions!.toLocaleString("en-AE")}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </LocalizedTree>
  );
}
