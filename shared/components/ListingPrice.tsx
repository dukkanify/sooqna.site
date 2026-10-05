"use client";

import type { Listing } from "@/types";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { useTx } from "@/shared/i18n/useTx";
import { QUOTE_PRICING_LABEL_AR, listingUsesQuotePricing } from "@/shared/listings/quote-pricing";

type CurrencyAmountSize = "sm" | "md" | "lg" | "xl";

type ListingPriceProps = {
  className?: string;
  listing: Pick<Listing, "price" | "categoryId" | "categorySpecs">;
  size?: CurrencyAmountSize;
};

const sizeClasses: Record<CurrencyAmountSize, string> = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-2xl font-bold",
  xl: "text-3xl font-black",
};

export function ListingPrice({
  className = "",
  listing,
  size = "md",
}: ListingPriceProps) {
  const t = useTx();

  if (listing.categoryId === "jobs") {
    const salary = String(listing.categorySpecs?.salary ?? "").trim();
    return (
      <span className={`text-ink ${sizeClasses[size]} ${className}`}>
        {salary || t("الراتب حسب الاتفاق")}
      </span>
    );
  }

  if (listingUsesQuotePricing(listing)) {
    return (
      <span className={`text-ink ${sizeClasses[size]} ${className}`}>
        {t(QUOTE_PRICING_LABEL_AR)}
      </span>
    );
  }

  return (
    <CurrencyAmount amount={listing.price} className={className} size={size} />
  );
}
