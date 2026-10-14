import Link from "next/link";
import type { Category, Listing } from "@/types";
import { PremiumListingCard } from "@/features/listings/components/PremiumListingCard";
import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { FEATURED_PAGE_PURPOSE } from "@/shared/listings/featured-page-rules";
import { listingCountLabel } from "@/shared/i18n/count-labels";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";

type FeaturedListingsViewProps = {
  categories: Category[];
  listings: Listing[];
  locale: "ar" | "en";
  /** Current Featured package length from admin settings. */
  packageDays: number;
};

/**
 * `/featured` UI — paid Featured package destination only.
 * Keep the header light: title, count, and actions — no policy essay.
 */
export function FeaturedListingsView({
  categories,
  listings,
  locale,
  packageDays,
}: FeaturedListingsViewProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const copy = FEATURED_PAGE_PURPOSE.ar;

  return (
    <LocalizedTree>
      <section className="app-container page-padding">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink md:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-1 text-sm font-semibold text-ink">
              {listingCountLabel(listings.length, locale)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/dashboard/listings" size="sm" variant="secondary">
              ميّز إعلانك
            </Button>
            <Link
              className="text-sm font-bold text-[#B8955F] hover:text-[#9a7d4a]"
              href="/search"
            >
              تصفّح كل الإعلانات
            </Link>
          </div>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            actionHref="/dashboard/listings"
            actionLabel="ميّز إعلانك من لوحة التحكم"
            description={`عندما يدفع بائع باقة التمييز (${Math.max(1, Math.round(packageDays))} يوماً)، يظهر إعلانه هنا مرتّباً ضمن المميزة النشطة. يمكنك تصفّح السوق كاملاً أو تمييز أحد إعلاناتك.`}
            eyebrow="لا إعلانات مميزة حالياً"
            icon="package"
            title="لا توجد إعلانات مميزة نشطة"
          >
            <div className="mt-4">
              <Button href="/search" size="sm" variant="ghost">
                تصفّح كل الإعلانات
              </Button>
            </div>
          </EmptyState>
        ) : (
          <div className={MARKETPLACE_LISTING_GRID_CLASS}>
            {listings.map((listing) => (
              <PremiumListingCard
                key={listing.id}
                categoryName={categoryMap.get(listing.categoryId)}
                listing={listing}
              />
            ))}
          </div>
        )}
      </section>
    </LocalizedTree>
  );
}
