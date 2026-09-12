import { Skeleton } from "@/shared/ui/Skeleton";

export function MobileFeaturedCardSkeleton() {
  return (
    <article
      aria-busy="true"
      aria-label="جاري تحميل الإعلان"
      className="mobile-home-featured-card w-[var(--mh-card-width)] min-w-[11.5rem] max-w-[14.5rem] shrink-0 flex-none snap-start"
    >
      <Skeleton className="aspect-[3/2] w-full !rounded-none" />
      <div className="space-y-2 p-2.5">
        <Skeleton height="0.875rem" width="45%" />
        <Skeleton height="0.75rem" width="90%" />
        <Skeleton height="0.75rem" width="70%" />
        <Skeleton height="0.625rem" width="55%" />
        <div className="flex justify-between border-t border-[var(--mh-border)] pt-2">
          <Skeleton className="!rounded-full" height="1.125rem" width="3rem" />
          <Skeleton height="0.625rem" width="2rem" />
        </div>
      </div>
    </article>
  );
}
