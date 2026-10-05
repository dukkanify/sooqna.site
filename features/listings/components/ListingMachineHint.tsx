"use client";

import type { Listing } from "@/types";
import { listingCopyIsMachine } from "@/shared/i18n/listing-copy";
import { useLocale } from "@/shared/i18n/useLocale";
import { useTx } from "@/shared/i18n/useTx";

type ListingMachineHintProps = {
  className?: string;
  field?: "title" | "description";
  listing: Pick<
    Listing,
    | "titleEnglish"
    | "descriptionEnglish"
    | "titleTranslationSource"
    | "descriptionTranslationSource"
  >;
};

export function ListingMachineHint({
  className = "",
  field = "title",
  listing,
}: ListingMachineHintProps) {
  const locale = useLocale();
  const t = useTx();
  if (!listingCopyIsMachine(listing, field, locale)) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border/80 bg-surface-muted px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-muted ${className}`.trim()}
    >
      {t("ترجمة تلقائية")}
    </span>
  );
}
