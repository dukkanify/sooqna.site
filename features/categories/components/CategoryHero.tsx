import Link from "next/link";
import type { Category } from "@/types";
import { PremiumListingCard } from "@/features/listings/components/PremiumListingCard";
import { AppImage } from "@/shared/components/AppImage";
import { Badge } from "@/shared/ui/Badge";
import { activeListingCountLabel } from "@/shared/i18n/count-labels";
import { getRequestLocale } from "@/shared/i18n/locale";
import { tx } from "@/shared/i18n/tx";
import { getListingBySlug } from "@/services/listings";

import "./category-hero.css";

type CategoryHeroProps = {
  category: Category;
  /** Compact banner for dense browse pages (e.g. cars) — less vertical chrome. */
  compact?: boolean;
  /**
   * Prefer the same total as the results grid/toolbar when provided so the
   * hero cannot drift (e.g. cached category badge vs live search count).
   */
  activeCount?: number;
};

export async function CategoryHero({
  category,
  compact = false,
  activeCount,
}: CategoryHeroProps) {
  const locale = await getRequestLocale();
  const categoryName = tx(locale, category.name);
  const listingCount =
    typeof activeCount === "number" ? activeCount : category.listingCount;
  const featuredListing =
    !compact && category.featuredListingSlug
      ? await getListingBySlug(category.featuredListingSlug)
      : undefined;

  if (compact) {
    return (
      <div className="category-hero mb-4 overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-white shadow-[var(--shadow-card)]">
        <div className="category-hero__media category-hero__media--compact relative w-full">
          <AppImage
            alt={categoryName}
            className="category-hero__image"
            fallbackCategory={category.id}
            fill
            priority
            sizes="100vw"
            src={category.imageUrl}
          />
          <div className="category-hero__shade" />
          <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
            <h1 className="text-xl font-black text-white md:text-2xl">
              {category.id === "cars" ? "سيارات للبيع" : categoryName}
            </h1>
            <p className="mt-0.5 text-sm text-white/85">
              {activeListingCountLabel(listingCount, locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-hero mb-5 overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-white shadow-[var(--shadow-card)]">
      <div className={featuredListing ? "grid lg:grid-cols-[1.15fr_0.85fr]" : ""}>
        <div className="category-hero__media relative w-full">
          <AppImage
            alt={categoryName}
            className="category-hero__image"
            fallbackCategory={category.id}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            src={category.imageUrl}
          />
          <div className="category-hero__shade" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
            <Badge variant="featured">{categoryName}</Badge>
            <h1 className="mt-2 text-xl font-bold text-white md:text-2xl">
              {categoryName}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {activeListingCountLabel(listingCount, locale)}
            </p>
          </div>
        </div>

        {featuredListing ? (
          <div className="hidden border-border p-3 lg:block lg:border-s lg:p-4">
            <p className="mb-2 text-xs font-bold text-[#B8955F]">إعلان مميز</p>
            <PremiumListingCard listing={featuredListing} />
            <Link
              className="mt-2 inline-block text-xs font-semibold text-primary"
              href={`/listings/${featuredListing.slug}`}
            >
              عرض التفاصيل الكاملة
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
