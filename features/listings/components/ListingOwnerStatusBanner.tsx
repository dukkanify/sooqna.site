import Link from "next/link";
import type { Listing } from "@/types";
import {
  listingStatusDescriptions,
  listingStatusLabels,
  listingStatusLabelsEn,
} from "@/shared/constants/listingStatuses";
import { listingNeedsOwnerStatusBanner } from "@/shared/listings/listing-page-access";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocale } from "@/shared/i18n/useLocale";
import { tx } from "@/shared/i18n/tx";
import { Icon } from "@/shared/ui/Icon";

export function ListingOwnerStatusBanner({
  listing,
}: {
  listing: Listing;
}) {
  const locale = useLocale();
  if (!listingNeedsOwnerStatusBanner(listing.status)) {
    return null;
  }

  const statusLabel =
    locale === "en"
      ? listingStatusLabelsEn[listing.status]
      : listingStatusLabels[listing.status];
  const description = listingStatusDescriptions[listing.status];
  const editHref = listing.id.startsWith("local-")
    ? `/listings/local/${listing.id}/edit`
    : `/listings/${listing.slug}/edit`;
  const dashboardHref = "/dashboard/listings";

  const tone =
    listing.status === "rejected" || listing.status === "expired"
      ? "warning"
      : listing.status === "sold"
        ? "muted"
        : "pending";

  const toneClass =
    tone === "warning"
      ? "border-error/25 bg-error-soft text-error"
      : tone === "muted"
        ? "border-border bg-surface-muted text-muted"
        : "border-[#c9a45c]/35 bg-[#c9a45c]/12 text-ink";

  return (
    <LocalizedTree>
      <div
        className={`mt-4 rounded-[var(--radius-xl)] border px-4 py-3 sm:px-5 sm:py-4 ${toneClass}`}
        role="status"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-white/50">
            <Icon name="clock" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">
              {tx(locale, "حالة إعلانك")}: {statusLabel}
            </p>
            <p className="mt-1 text-sm font-medium leading-6 opacity-90">
              {tx(locale, description)}
            </p>
            {listing.status === "rejected" && listing.rejectionReason ? (
              <p className="mt-2 text-sm font-semibold leading-6">
                {tx(locale, "السبب")}: {listing.rejectionReason}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
              <Link className="underline underline-offset-2" href={dashboardHref}>
                {tx(locale, "إعلاناتي")}
              </Link>
              {listing.status === "pending_review" ||
              listing.status === "rejected" ||
              listing.status === "draft" ? (
                <Link className="underline underline-offset-2" href={editHref}>
                  {tx(locale, "تعديل الإعلان")}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </LocalizedTree>
  );
}
