"use client";

import { useEffect, useMemo, useState } from "react";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { listingMatchesSmartFilters } from "@/shared/listings/listing-filter-match";
import { toListingSearchFilters } from "@/features/search/lib/to-listing-filters";
import {
  activeFilterCount,
  type SearchFilterState,
} from "@/features/search/components/search-url";
import { isConfirmedFixtureListing } from "@/services/listings/mock-catalog-policy";
import { isShowcaseListing } from "@/shared/listings/showcase-listing";
import type { Category, Listing } from "@/types";
import { ListingCard } from "@/features/listings/components/ListingCard";
import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { SearchResultsToolbar } from "@/features/search/components/SearchResultsToolbar";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";
import {
  getLocalListingsForSeller,
  getSessionUser,
} from "@/services/storage";

const PAGE_SIZE = 12;

type SearchResultsListProps = {
  basePath?: string;
  categoryId?: string;
  categories: Category[];
  listings: Listing[];
  selectedFilters?: SearchFilterState;
  serverTotal?: number;
};

export function SearchResultsList({
  basePath = "/search",
  categoryId,
  categories,
  listings,
  selectedFilters = {},
  serverTotal,
}: SearchResultsListProps) {
  const [localListings, setLocalListings] = useState<Listing[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const resultsSignature = `${categoryId ?? ""}:${listings.length}:${JSON.stringify(selectedFilters)}`;
  const [activeSignature, setActiveSignature] = useState(resultsSignature);

  if (activeSignature !== resultsSignature) {
    setActiveSignature(resultsSignature);
    setVisibleCount(PAGE_SIZE);
  }

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const visibleListings = useMemo(() => {
    const listingFilters = toListingSearchFilters({
      ...selectedFilters,
      category: categoryId || selectedFilters.category,
    });
    const matchingLocalListings = localListings
      .filter((listing) => listing.status === "active")
      .filter((listing) => !isConfirmedFixtureListing(listing))
      .filter((listing) => !isShowcaseListing(listing))
      .filter((listing) => listingMatchesSmartFilters(listing, listingFilters))
      .filter((listing) => !listings.some((item) => item.id === listing.id));

    return [...matchingLocalListings, ...listings].sort((a, b) => {
      if (selectedFilters.sort === "price_asc") return a.price - b.price;
      if (selectedFilters.sort === "price_desc") return b.price - a.price;
      return b.id.localeCompare(a.id);
    });
  }, [categoryId, listings, localListings, selectedFilters]);

  const resultCount =
    typeof serverTotal === "number"
      ? serverTotal +
        visibleListings.filter((listing) => listing.id.startsWith("local-")).length
      : visibleListings.length;

  useEffect(() => {
    const syncLocalListings = () => {
      const user = getSessionUser();
      setLocalListings(
        user ? getLocalListingsForSeller(user.id) : [],
      );
    };

    syncLocalListings();
    window.addEventListener(STORAGE_EVENTS.listingsChange, syncLocalListings);
    window.addEventListener(STORAGE_EVENTS.sessionChange, syncLocalListings);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.listingsChange, syncLocalListings);
      window.removeEventListener(STORAGE_EVENTS.sessionChange, syncLocalListings);
    };
  }, []);

  if (visibleListings.length === 0) {
    const hasActiveFilters = activeFilterCount(selectedFilters) > 0;
    return (
      <>
        <SearchResultsToolbar
          basePath={basePath}
          categories={categories}
          resultCount={resultCount}
          selectedFilters={selectedFilters}
        />
        <EmptyState
          actionHref={hasActiveFilters ? "/search" : "/listings/new"}
          actionLabel={hasActiveFilters ? "عرض كل الإعلانات" : "أضف إعلاناً"}
          description={
            hasActiveFilters
              ? "جرّب تعديل الفلاتر أو البحث بكلمات مختلفة."
              : "لا نعرض بيانات تجريبية لملء السوق. ستظهر الإعلانات الحقيقية هنا عند نشرها."
          }
          eyebrow="لا نتائج"
          icon="search"
          title={
            hasActiveFilters
              ? "لم نجد إعلانات مطابقة"
              : "لا توجد إعلانات متاحة حالياً."
          }
        />
      </>
    );
  }

  const pageItems = visibleListings.slice(0, visibleCount);
  const hasMore = visibleCount < visibleListings.length;

  return (
    <>
      <SearchResultsToolbar
        basePath={basePath}
        categories={categories}
        resultCount={resultCount}
        selectedFilters={selectedFilters}
      />
      <div className={`${MARKETPLACE_LISTING_GRID_CLASS} page-enter`}>
        {pageItems.map((listing) => (
          <ListingCard
            key={listing.id}
            categoryName={categoryNames.get(listing.categoryId)}
            listing={listing}
          />
        ))}
      </div>
      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            size="md"
            variant="secondary"
          >
            عرض المزيد ({visibleListings.length - visibleCount})
          </Button>
        </div>
      ) : null}
    </>
  );
}
