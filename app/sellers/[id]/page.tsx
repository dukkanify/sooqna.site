import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MobileBottomNav } from "@/features/home/components/mobile/MobileBottomNav";
import { ListingCard } from "@/features/listings/components/ListingCard";
import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { AppImage } from "@/shared/components/AppImage";
import { BRAND } from "@/shared/constants/brand";
import { listingCountLabel } from "@/shared/i18n/count-labels";
import { sellerName } from "@/shared/i18n/listing-copy";
import { getRequestLocale } from "@/shared/i18n/locale";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { tx } from "@/shared/i18n/tx";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import {
  getSellerListings,
  getSellerProfile,
} from "@/services/sellers/seller-profile.service";

type SellerPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  const sellerId = decodeURIComponent(id);
  const listings = await getSellerListings(sellerId);
  const seller = getSellerProfile(sellerId, listings);
  const locale = await getRequestLocale();

  if (!seller) {
    return { title: tx(locale, "البائع غير موجود") };
  }

  const name = sellerName(seller, locale);
  const description =
    locale === "en"
      ? `Browse all listings from ${name} on Sooqna.`
      : `تصفح كل إعلانات ${seller.name} على ${BRAND.nameAr}.`;

  return {
    title: name,
    description,
    openGraph: {
      description,
      locale: locale === "en" ? "en_AE" : "ar_AE",
      title: name,
      type: "profile",
    },
  };
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  const sellerId = decodeURIComponent(id);
  const [listings, locale] = await Promise.all([
    getSellerListings(sellerId),
    getRequestLocale(),
  ]);
  const seller = getSellerProfile(sellerId, listings);
  if (!seller) notFound();

  const name = sellerName(seller, locale);
  const showRating =
    typeof seller.rating === "number" &&
    seller.rating > 0 &&
    (seller.reviewCount ?? 0) > 0;
  const showResponseTime = Boolean(seller.responseTime?.trim());
  const showTransactions =
    typeof seller.completedTransactions === "number" &&
    seller.completedTransactions > 0;

  return (
    <>
      <SiteHeader />
      <LocalizedTree>
        <main>
          <section className="app-container page-padding pb-28 lg:pb-8">
            <Breadcrumbs
              items={[
                { href: "/", label: "الرئيسية" },
                { href: "/search", label: "البحث" },
                { label: name },
              ]}
            />

            <div className="marketplace-panel mt-2 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-4">
                {seller.avatarUrl ? (
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-2xl)]">
                    <AppImage
                      alt={name}
                      className="object-cover"
                      fallback="avatar"
                      fill
                      sizes="64px"
                      src={seller.avatarUrl}
                    />
                  </span>
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-[var(--radius-2xl)] bg-primary text-lg font-bold text-white">
                    {name.slice(0, 2)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-secondary">البائع</p>
                  <h1 className="mt-1 text-2xl font-black text-ink" data-ugc>
                    {name}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-muted">
                    {listingCountLabel(listings.length, locale)}
                  </p>
                  {showRating || showResponseTime || showTransactions ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                      {showRating ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1.5">
                          <Icon className="text-secondary" name="star" size={12} />
                          {seller.rating}
                          {seller.reviewCount
                            ? ` · ${seller.reviewCount.toLocaleString("en-AE")}`
                            : null}
                        </span>
                      ) : null}
                      {showResponseTime ? (
                        <span className="rounded-full bg-surface-muted px-3 py-1.5">
                          {tx(locale, "الرد")}: {seller.responseTime}
                        </span>
                      ) : null}
                      {showTransactions ? (
                        <span className="rounded-full bg-surface-muted px-3 py-1.5">
                          {tx(locale, "معاملات مكتملة")}:{" "}
                          {seller.completedTransactions!.toLocaleString("en-AE")}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-black text-ink">
                {tx(locale, "كل إعلانات هذا البائع")}
              </h2>
              {listings.length > 0 ? (
                <div className={`mt-4 ${MARKETPLACE_LISTING_GRID_CLASS}`}>
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    actionHref="/search"
                    actionLabel="تصفح السوق"
                    description="لا توجد إعلانات نشطة لهذا البائع حالياً."
                    icon="package"
                    title="لا توجد إعلانات"
                  />
                </div>
              )}
            </div>
          </section>
        </main>
      </LocalizedTree>
      <SiteFooter />
      <MobileBottomNav />
    </>
  );
}
