import { countries } from "@/shared/constants/locations";
import { getLocations } from "@/services/locations/location-store";
import { MobileBottomNav } from "@/features/home/components/mobile/MobileBottomNav";
import { RecordRecentSearch } from "@/features/search/components/RecordRecentSearch";
import { SearchFilters } from "@/features/search/components/SearchFilters";
import { SearchResultsList } from "@/features/search/components/SearchResultsList";
import { parseSearchFilterState } from "@/features/search/components/search-url";
import { toListingSearchFilters } from "@/features/search/lib/to-listing-filters";
import { buildSearchSuggestions } from "@/features/search/components/search-suggestions";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { getCategories } from "@/services/categories";
import { getSearchSuggestionTitles } from "@/services/listings/home-feed";
import { countSearchListings, searchListings } from "@/services/listings";
import { getRequestLocale } from "@/shared/i18n/locale";

type SearchParams = Record<string, string | string[] | undefined>;

function parseHomePriceBand(band?: string): {
  maxPrice?: string;
  minPrice?: string;
} {
  if (!band) return {};

  if (band.endsWith("+")) {
    const minPrice = Number(band.slice(0, -1));
    return Number.isFinite(minPrice) ? { minPrice: String(minPrice) } : {};
  }

  const [rawMin, rawMax] = band.split("-");
  const minPrice = Number(rawMin);
  const maxPrice = Number(rawMax);

  return {
    ...(Number.isFinite(minPrice) ? { minPrice: String(minPrice) } : {}),
    ...(Number.isFinite(maxPrice) ? { maxPrice: String(maxPrice) } : {}),
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedFilters = parseSearchFilterState(params);
  const priceBand = parseHomePriceBand(
    Array.isArray(params.price) ? params.price[0] : params.price,
  );
  if (!selectedFilters.minPrice && priceBand.minPrice) {
    selectedFilters.minPrice = priceBand.minPrice;
  }
  if (!selectedFilters.maxPrice && priceBand.maxPrice) {
    selectedFilters.maxPrice = priceBand.maxPrice;
  }

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
      <main className="bg-background">
        <section className="app-container page-padding pb-28 lg:pb-8">
          <div className="mb-5">
            <p className="text-xs font-bold text-[#B8955F]">بحث السوق</p>
            <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">
              {selectedFilters.query
                ? `نتائج: ${selectedFilters.query}`
                : "اعثر على الإعلان المناسب"}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
              اختر الإمارة والسعر والتصنيف — ثم ضيّق النتيجة من الفلاتر إذا احتجت.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
            <aside className="min-w-0 md:sticky md:top-24 md:self-start">
              <SearchFilters
                categories={categories}
                cities={cities}
                countries={countries}
                layout="sidebar"
                selectedFilters={selectedFilters}
                suggestions={suggestions}
              />
            </aside>

            <div className="min-w-0">
              <SearchResultsList
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
