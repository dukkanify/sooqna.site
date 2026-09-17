import type { Metadata } from "next";
import { BRAND } from "@/shared/constants/brand";
import { notFound } from "next/navigation";
import { countries } from "@/shared/constants/locations";
import { getLocations } from "@/services/locations/location-store";
import { CategoryHero } from "@/features/categories/components/CategoryHero";
import { MobileBottomNav } from "@/features/home/components/mobile/MobileBottomNav";
import { RecordRecentSearch } from "@/features/search/components/RecordRecentSearch";
import { SearchFilters } from "@/features/search/components/SearchFilters";
import { SearchResultsList } from "@/features/search/components/SearchResultsList";
import { parseSearchFilterState } from "@/features/search/components/search-url";
import { toListingSearchFilters } from "@/features/search/lib/to-listing-filters";
import { buildSearchSuggestions } from "@/features/search/components/search-suggestions";
import { Badge } from "@/shared/ui/Badge";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ChipLink } from "@/shared/ui/ChipLink";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import {
  getCategories,
  getCategoryBySlug,
} from "@/services/categories";
import { getSearchSuggestionTitles } from "@/services/listings/home-feed";
import { countSearchListings, searchListings } from "@/services/listings";
import { getRequestLocale } from "@/shared/i18n/locale";
import { tx } from "@/shared/i18n/tx";

const ESCROW_CHECKOUT_CATEGORIES = new Set([
  "mobiles",
  "electronics",
  "furniture",
  "fashion",
  "kids",
  "sports",
  "books",
  "food",
]);

type SearchParams = Record<string, string | string[] | undefined>;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  const locale = await getRequestLocale();
  if (!category) {
    return { title: tx(locale, "القسم غير موجود") };
  }
  const name = tx(locale, category.name);
  const description =
    locale === "en"
      ? `Browse ${name} listings on Sooqna.`
      : `تصفح إعلانات ${category.name} في ${BRAND.nameAr}.`;
  return {
    title: name,
    description,
    openGraph: {
      description,
      locale: locale === "en" ? "en_AE" : "ar_AE",
      title: name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      description,
      title: name,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const selectedFilters = {
    ...parseSearchFilterState(queryParams),
    category: category.id,
  };
  const listingFilters = toListingSearchFilters(selectedFilters);

  const [categories, listings, total, suggestionTitles, locale, locationRows] =
    await Promise.all([
      getCategories(),
      searchListings(listingFilters),
      countSearchListings(listingFilters),
      getSearchSuggestionTitles(),
      getRequestLocale(),
      getLocations({ enabledOnly: true }),
    ]);
  const cities = locationRows.map((loc) => ({ id: loc.id, name: loc.name }));

  const suggestions = buildSearchSuggestions({
    categories,
    cities,
    listings: suggestionTitles,
    locale,
    selectedFilters,
  });

  return (
    <>
      <SiteHeader />
      <RecordRecentSearch query={selectedFilters.query} />
      <main>
        <section className="app-container page-padding pb-28 lg:pb-8">
          <Breadcrumbs
            items={[
              { href: "/", label: "الرئيسية" },
              { href: "/categories", label: "التصنيفات" },
              { label: category.name },
            ]}
          />

          <CategoryHero category={category} />

          <div className="mb-4 flex flex-wrap gap-1.5 md:mb-3">
            {category.subcategories.map((subcategory) => (
              <ChipLink
                key={subcategory}
                href={`/categories/${category.slug}?subcategory=${encodeURIComponent(subcategory)}`}
                label={subcategory}
              />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[16rem_1fr] md:gap-5 lg:grid-cols-[18rem_1fr] lg:gap-6 xl:grid-cols-[20rem_1fr]">
            <aside className="md:sticky md:top-24 md:self-start">
              <SearchFilters
                action={`/categories/${category.slug}`}
                categories={categories}
                cities={cities}
                countries={countries}
                layout="sidebar"
                selectedFilters={selectedFilters}
                showCategory={false}
                suggestions={suggestions}
              />
            </aside>

            <div>
              {ESCROW_CHECKOUT_CATEGORIES.has(category.id) ? (
                <div className="mb-3">
                  <Badge variant="escrow">ضمان مالي على الإعلانات المؤهلة</Badge>
                </div>
              ) : null}
              <SearchResultsList
                basePath={`/categories/${category.slug}`}
                categoryId={category.id}
                categories={categories}
                listings={listings}
                selectedFilters={selectedFilters}
                serverTotal={total}
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </>
  );
}
