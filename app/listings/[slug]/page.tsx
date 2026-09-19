import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingDetailsView } from "@/features/listings/components/ListingDetailsView";
import {
  RecentlyViewedSection,
  RecentlyViewedTracker,
} from "@/features/listings/components/RecentlyViewedSection";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { getCategories } from "@/services/categories";
import { getListingBySlug, getRelatedListings } from "@/services/listings";
import { getValidSessionUser } from "@/services/auth/require-session";
import { resolveListingPageAccess } from "@/shared/listings/listing-page-access";
import { listingDescription, listingTitle } from "@/shared/i18n/listing-copy";
import { getRequestLocale } from "@/shared/i18n/locale";
import { tx } from "@/shared/i18n/tx";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const session = await getValidSessionUser();
  const listing =
    (await getListingBySlug(slug, {
      includeFixtures: Boolean(session),
    })) ?? (await getListingBySlug(slug));
  const locale = await getRequestLocale();
  if (!listing) {
    return {
      title: tx(locale, "الإعلان غير موجود"),
    };
  }
  const access = resolveListingPageAccess(listing, session);
  if (access.kind === "not_found") {
    return {
      title: tx(locale, "الإعلان غير موجود"),
    };
  }
  const title = listingTitle(listing, locale);
  const description = listingDescription(listing, locale).slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      description,
      locale: locale === "en" ? "en_AE" : "ar_AE",
      title,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      description,
      title,
    },
  };
}

export default async function ListingDetailsPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const session = await getValidSessionUser();
  // Authenticated viewers (seller/admin) also need fixture/demo rows and their
  // own pending_review ads — load with fixtures first when a session exists.
  let listing = session
    ? await getListingBySlug(slug, { includeFixtures: true })
    : await getListingBySlug(slug);
  if (!listing && session) {
    listing = await getListingBySlug(slug);
  }

  const access = resolveListingPageAccess(listing, session);
  if (access.kind === "not_found") notFound();
  if (access.kind === "login_required") {
    redirect(`/login?next=${encodeURIComponent(`/listings/${slug}`)}`);
  }

  const { listing: visible, isPreview } = access;
  const locale = await getRequestLocale();
  const [categories, relatedListings] = await Promise.all([
    getCategories(),
    getRelatedListings(visible.categoryId, visible.id, visible),
  ]);
  const category = categories.find((item) => item.id === visible.categoryId);

  return (
    <>
      <SiteHeader />
      <RecentlyViewedTracker listing={visible} />
      <main className="pb-28 lg:pb-0">
        <ListingDetailsView
          breadcrumbs={[
            { href: "/", label: tx(locale, "الرئيسية") },
            { href: "/search", label: tx(locale, "الإعلانات") },
            ...(category
              ? [{ href: `/categories/${category.slug}`, label: tx(locale, category.name) }]
              : []),
            { label: listingTitle(visible, locale) },
          ]}
          category={category}
          listing={visible}
          relatedListings={isPreview ? [] : relatedListings}
          showOwnerStatusBanner={isPreview}
        />
        {isPreview ? null : (
          <RecentlyViewedSection
            categories={categories}
            currentSlug={visible.slug}
            listings={[visible, ...relatedListings]}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
