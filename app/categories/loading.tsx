import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { ListingCardSkeleton } from "@/shared/ui/Skeleton";

export default function CategoriesLoading() {
  return (
    <div className="app-container page-padding">
      <div className="surface-gradient mb-8 h-36 animate-pulse rounded-[var(--radius-2xl)]" />
      <div className={MARKETPLACE_LISTING_GRID_CLASS}>
        {Array.from({ length: 8 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
