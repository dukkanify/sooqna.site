import type { Listing } from "@/types";
import { DragScrollRow } from "@/shared/components/DragScrollRow";
import { getNearbyListings } from "./mobile-home.config";
import { MobileFeaturedCard } from "./MobileFeaturedCard";
import { MobileSectionHeader } from "./MobileSectionHeader";

type MobileNearbyRailProps = {
  listings: Listing[];
};

export function MobileNearbyRail({ listings }: MobileNearbyRailProps) {
  const nearby = getNearbyListings(listings, 8);

  if (nearby.length === 0) return null;

  return (
    <section aria-label="القريبة منك" className="mobile-home-nearby">
      <MobileSectionHeader actionHref="/search" icon="map" title="القريبة منك" />
      <DragScrollRow className="mobile-home-featured__track mobile-home-scroll flex w-full max-w-full flex-nowrap overflow-x-auto overscroll-x-contain">
        {nearby.map(({ listing }) => (
          <MobileFeaturedCard key={listing.id} listing={listing} />
        ))}
      </DragScrollRow>
    </section>
  );
}
