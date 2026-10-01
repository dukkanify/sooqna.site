import { Badge } from "@/shared/ui/Badge";
import { FeaturedBadge } from "@/features/listings/components/FeaturedBadge";
import {
  getListingCardBadges,
  type ListingCardBadge,
} from "@/features/listings/components/listing-card-badges";
import type { Listing } from "@/types";

import "./featured-badge.css";

type ListingCardBadgesProps = {
  className?: string;
  listing: Listing;
  /** Override resolved badges (optional). */
  badges?: ListingCardBadge[];
  /** Use static flow instead of absolute overlay (gallery/detail). */
  inline?: boolean;
  /** Larger featured marker on listing gallery. */
  featuredSize?: "sm" | "md";
  /** Stronger shadow when badges sit on photos (gallery / cards). */
  onMedia?: boolean;
  /**
   * Skip Featured here — cards render it as a cap above the ad
   * so it never overlaps photo badges like «جديد».
   */
  excludeFeatured?: boolean;
};

export function ListingCardBadges({
  className = "",
  listing,
  badges,
  inline = false,
  featuredSize = "sm",
  onMedia,
  excludeFeatured = false,
}: ListingCardBadgesProps) {
  const items = (badges ?? getListingCardBadges(listing)).filter((badge) =>
    excludeFeatured ? badge.key !== "featured" : true,
  );
  if (items.length === 0) return null;

  const overMedia = onMedia ?? !inline;

  const layoutClass = inline
    ? "relative flex flex-wrap items-center gap-1.5"
    : "pointer-events-none absolute start-2.5 top-2.5 z-10 flex max-w-[calc(100%-4.5rem)] flex-wrap items-center gap-1.5";

  return (
    <div className={`${layoutClass} ${className}`.trim()}>
      {items.map((badge) =>
        badge.key === "featured" ? (
          <FeaturedBadge
            key={badge.key}
            onMedia={overMedia}
            placement="chip"
            size={featuredSize}
          />
        ) : (
          <Badge
            key={badge.key}
            className="rounded-md px-2 py-0.5 text-[0.7rem] font-bold shadow-[0_2px_8px_rgb(15_23_42/14%)]"
            variant={badge.variant}
          >
            {badge.label}
          </Badge>
        ),
      )}
    </div>
  );
}
