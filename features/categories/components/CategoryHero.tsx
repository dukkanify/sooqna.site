import Link from "next/link";
import type { Category } from "@/types";
import { PremiumListingCard } from "@/features/listings/components/PremiumListingCard";
import { AppImage } from "@/shared/components/AppImage";
import { Badge } from "@/shared/ui/Badge";
import { activeListingCountLabel } from "@/shared/i18n/count-labels";
import { getRequestLocale } from "@/shared/i18n/locale";
import { tx } from "@/shared/i18n/tx";
import { getListingBySlug } from "@/services/listings";

type CategoryHeroProps = {
  category: Category;
  /** Compact banner for dense browse pages (e.g. cars) — less vertical chrome. */
  compact?: boolean;
};

export async function CategoryHero({ category, compact = false }: CategoryHeroProps) {
  const locale = await getRequestLocale();
  const categoryName = tx(locale, category.name);
  const featuredListing =
    !compact && category.featuredListingSlug
      ? await getListingBySlug(category.featuredListingSlug)
      : undefined;

  if (compact) {
    return (
      <div className="mb-4 overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-white shadow-[var(--shadow-card)]">
        <div className="relative min-h-[5.5rem] md:min-h-[6.25rem]">
          <AppImage
            alt={categoryName}
            className="object-cover"
            fallbackCategory={category.id}
            fill
            priority
            sizes="100vw"
            src={category.imageUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
            <h1 className="text-xl font-black text-white md:text-2xl">
              {category.id === "cars" ? "سيارات للبيع" : categoryName}
            </h1>
            <p className="mt-0.5 text-sm text-white/85">
              {activeListingCountLabel(category.listingCount, locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-white shadow-[var(--shadow-card)]">
      <div className={featuredListing ? "grid lg:grid-cols-[1.15fr_0.85fr]" : ""}>
        <div className="relative min-h-[7.5rem] md:min-h-[8.5rem] lg:min-h-[11rem]">
          <AppImage
            alt={categoryName}
            className="object-cover"
            fallbackCategory={category.id}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            src={category.imageUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
            <Badge variant="featured">{categoryName}</Badge>
            <h1 className="mt-2 text-xl font-bold text-white md:text-2xl">
              {categoryName}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {activeListingCountLabel(category.listingCount, locale)}
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
