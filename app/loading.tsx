import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { ListingCardSkeleton } from "@/shared/ui/Skeleton";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";

export default function RootLoading() {
  return (
    <>
      <SiteHeader />
      <main className="app-container page-padding">
        <div className="surface-gradient mb-8 h-40 animate-pulse rounded-[var(--radius-2xl)]" />
        <div className={MARKETPLACE_LISTING_GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
