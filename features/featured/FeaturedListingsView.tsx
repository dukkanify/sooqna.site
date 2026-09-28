import Link from "next/link";
import type { Category, Listing } from "@/types";
import { PremiumListingCard } from "@/features/listings/components/PremiumListingCard";
import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { listingCountLabel } from "@/shared/i18n/count-labels";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";

type FeaturedListingsViewProps = {
  categories: Category[];
  listings: Listing[];
  locale: "ar" | "en";
};

/**
 * Product contract for /featured:
 * - Shows paid featured placements only (active isFeatured, not expired).
 * - Not a curated “best of UAE” feed, not escrow-only, not the full catalog.
 * - Job: help buyers browse boosted ads; give sellers a clear path to feature.
 */
export function FeaturedListingsView({
  categories,
  listings,
  locale,
}: FeaturedListingsViewProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <LocalizedTree>
      <section className="app-container page-padding">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold text-[#B8955F]">المميزة</p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">
            إعلانات مميزة
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            هنا تظهر فقط الإعلانات التي فعّل أصحابها باقة التمييز المدفوعة —
            لظهور أوضح في سوقنا خلال مدة الباقة. ليست قائمة «أفضل العروض»
            العامة، ولا تعني أن كل إعلان مشمول بالضمان المالي.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-ink">
              {listingCountLabel(listings.length, locale)}
            </p>
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
            description="عندما يدفع بائع باقة التمييز، يظهر إعلانه هنا طوال مدة الباقة. يمكنك تصفّح السوق كاملاً أو تمييز أحد إعلاناتك."
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
