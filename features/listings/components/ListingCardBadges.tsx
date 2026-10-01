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
};

export function ListingCardBadges({
  className = "",
  listing,
  badges,
  inline = false,
  featuredSize = "sm",
  onMedia,
}: ListingCardBadgesProps) {
  const items = badges ?? getListingCardBadges(listing);
  if (items.length === 0) return null;

  const overMedia = onMedia ?? !inline;
  const featured = items.find((badge) => badge.key === "featured");
  const rest = items.filter((badge) => badge.key !== "featured");
  const useCorner = Boolean(featured) && !inline;

  if (inline) {
    return (
      <div
        className={`relative flex flex-wrap items-center gap-1.5 ${className}`.trim()}
      >
        {featured ? (
          <FeaturedBadge onMedia={overMedia} size={featuredSize} />
        ) : null}
        {rest.map((badge) => (
          <Badge
            key={badge.key}
            className="rounded-md px-2 py-0.5 text-[0.7rem] font-bold shadow-[0_2px_8px_rgb(15_23_42/14%)]"
            variant={badge.variant}
          >
            {badge.label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <>
      {featured ? (
        <FeaturedBadge
          corner
          onMedia={overMedia}
          size={featuredSize}
        />
      ) : null}
      {rest.length > 0 ? (
        <div
          className={`pointer-events-none absolute z-10 flex max-w-[calc(100%-4.5rem)] flex-wrap items-center gap-1.5 ${
            useCorner ? "start-2.5 top-11" : "start-2.5 top-2.5"
          } ${className}`.trim()}
        >
          {rest.map((badge) => (
            <Badge
              key={badge.key}
              className="rounded-md px-2 py-0.5 text-[0.7rem] font-bold shadow-[0_2px_8px_rgb(15_23_42/14%)]"
              variant={badge.variant}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      ) : null}
    </>
  );
}
