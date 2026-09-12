import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { ListingCardSkeleton } from "@/shared/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div className="app-container page-padding">
      <div className="surface-gradient mb-8 h-36 animate-pulse rounded-[var(--radius-2xl)]" />
      <div className="mb-6 h-24 animate-pulse rounded-[var(--radius-2xl)] bg-surface-muted" />
      <div className={MARKETPLACE_LISTING_GRID_CLASS}>
        {Array.from({ length: 8 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
