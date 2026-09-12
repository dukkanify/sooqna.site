import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  height?: string;
  width?: string;
};

export function Skeleton({
  className = "",
  height = "1rem",
  width = "100%",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`skeleton ${className}`}
      style={{ height, width }}
      {...props}
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div aria-busy="true" aria-label="جاري تحميل الإعلان" className="marketplace-card flex h-full flex-col overflow-hidden">
      <div className="aspect-[3/2]">
        <Skeleton className="h-full w-full !rounded-none" />
      </div>
      <div className="min-h-[7.5rem] space-y-2 p-2.5 sm:p-3">
        <Skeleton height="0.55rem" width="30%" />
        <Skeleton height="0.75rem" width="90%" />
        <Skeleton height="0.75rem" width="70%" />
        <div className="hidden items-center gap-2 pt-0.5 sm:flex">
          <Skeleton className="!rounded-full" height="1.25rem" width="1.25rem" />
          <Skeleton height="0.65rem" width="40%" />
        </div>
        <Skeleton height="0.65rem" width="50%" />
        <div className="flex justify-between border-t border-border/50 pt-2">
          <Skeleton height="0.65rem" width="3.5rem" />
          <Skeleton height="0.75rem" width="4rem" />
        </div>
      </div>
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="جاري تحميل الإعلان" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-3">
        <Skeleton className="aspect-[4/3] w-full !rounded-[var(--radius-2xl)] lg:min-h-[28rem]" />
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-48 w-full !rounded-[var(--radius-2xl)]" />
        <Skeleton className="h-36 w-full !rounded-[var(--radius-2xl)]" />
        <Skeleton className="h-28 w-full !rounded-[var(--radius-2xl)]" />
      </div>
      <Skeleton className="h-40 w-full !rounded-[var(--radius-2xl)] lg:col-span-2" />
    </div>
  );
}
