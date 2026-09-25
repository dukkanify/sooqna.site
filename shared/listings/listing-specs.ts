import type { Listing } from "@/types";
import { getCategoryFieldLabel, getCategoryFields } from "@/shared/constants/category-fields";
import {
  CATEGORY_SEARCH_KEYWORDS,
  searchTextMatches,
} from "@/shared/listings/search-text";

export type SpecEntry = {
  key: string;
  label: string;
  value: string;
};

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed !== "—";
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return false;
}

function formatValue(key: string, value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }
  if (key === "area" || key === "areaSqft") {
    return `${Number(value).toLocaleString("en-AE")} قدم مربع`;
  }
  if (key === "mileage") {
    return `${value} كم`;
  }
  return String(value);
}

function isUserCreatedListing(listing: Listing): boolean {
  return (
    listing.id.startsWith("local-") ||
    listing.id.startsWith("admin-") ||
    Boolean(listing.categorySpecs && Object.keys(listing.categorySpecs).length > 0)
  );
}

/** Extract typed mock specs — only for catalog listings */
function getMockSpecEntries(listing: Listing): SpecEntry[] {
  const entries: SpecEntry[] = [];

  if (listing.carSpecs) {
    for (const [key, value] of Object.entries(listing.carSpecs)) {
      if (!hasValue(value)) continue;
      entries.push({
        key,
        label: getCategoryFieldLabel("cars", key),
        value: formatValue(key, value),
      });
    }
  }

  if (listing.realEstateSpecs) {
    const { amenities, ...rest } = listing.realEstateSpecs;
    for (const [key, value] of Object.entries(rest)) {
      if (!hasValue(value)) continue;
      entries.push({
        key,
        label: getCategoryFieldLabel("real-estate", key),
        value: formatValue(key, value as string | number),
      });
    }
    if (hasValue(amenities) && amenities.length > 0) {
      entries.push({
        key: "amenities",
        label: "المرافق",
        value: amenities.join(" · "),
      });
    }
  }

  if (listing.electronicsSpecs) {
    for (const [key, value] of Object.entries(listing.electronicsSpecs)) {
      if (!hasValue(value)) continue;
      entries.push({
        key,
        label: getCategoryFieldLabel(
          listing.categoryId === "mobiles" ? "mobiles" : "electronics",
          key,
        ),
        value: String(value),
      });
    }
  }

  return entries;
}

/** User-entered categorySpecs — strict, no fallbacks */
function getUserSpecEntries(listing: Listing): SpecEntry[] {
  if (!listing.categorySpecs) {
    return [];
  }

  const fieldOrder = getCategoryFields(listing.categoryId).map((field) => field.key);
  const entries: SpecEntry[] = [];

  for (const key of fieldOrder) {
    if (key === "features") continue;
    const value = listing.categorySpecs[key];
    if (!hasValue(value)) continue;
    entries.push({
      key,
      label: getCategoryFieldLabel(listing.categoryId, key),
      value: formatValue(key, value as string | number | boolean),
    });
  }

  for (const [key, value] of Object.entries(listing.categorySpecs)) {
    if (fieldOrder.includes(key) || key === "features") continue;
    if (!hasValue(value)) continue;
    entries.push({
      key,
      label: getCategoryFieldLabel(listing.categoryId, key),
      value: formatValue(key, value as string | number | boolean),
    });
  }

  return entries;
}

export function getListingSpecEntries(listing: Listing): SpecEntry[] {
  if (isUserCreatedListing(listing)) {
    return getUserSpecEntries(listing);
  }
  return getMockSpecEntries(listing);
}

/** High-value car fields for above-the-fold strips (cards / sticky / mobile). */
export function getCarKeySpecRows(
  listing: Listing,
): { label: string; value: string }[] {
  const inferred = inferCarDisplaySpecs(listing);
  return [
    { label: "السنة", value: inferred.year },
    { label: "العداد", value: inferred.mileageLabel },
    { label: "الحالة", value: inferred.condition },
    { label: "ناقل الحركة", value: inferred.transmission },
    { label: "الوقود", value: inferred.fuel },
    { label: "المواصفات", value: inferred.regionalSpecs },
  ].filter((row) => row.value.trim().length > 0);
}

export function getCarCardMetaLine(listing: Listing): string {
  const inferred = inferCarDisplaySpecs(listing);
  return [inferred.year, inferred.mileageLabel].filter(Boolean).join(" · ");
}

const CONDITION_LABELS: Record<string, string> = {
  excellent: "ممتاز",
  new: "جديد",
  used: "مستعمل",
  refurbished: "مجدّد",
  for_parts: "للقطع",
  not_working: "لا يعمل",
};

/** Prefer stored categorySpecs; fall back to title/features when specs were stripped. */
function inferCarDisplaySpecs(listing: Listing): {
  year: string;
  mileageLabel: string;
  condition: string;
  transmission: string;
  fuel: string;
  regionalSpecs: string;
} {
  const specs = listing.categorySpecs ?? {};
  const car = listing.carSpecs;
  const title = `${listing.titleEnglish ?? ""} ${listing.title ?? ""}`;
  const yearFromTitle = title.match(/\b(20\d{2}|19\d{2})\b/)?.[1] ?? "";
  const mileageRaw = specs.mileage ?? car?.mileage;
  const mileageLabel = mileageRaw
    ? `${Number(mileageRaw).toLocaleString("en-AE")} كم`
    : "";

  let fuel = String(specs.fuelType ?? car?.fuel ?? "");
  if (!fuel) {
    const sub = listing.subcategory ?? "";
    if (/كهرب|electric|ev/i.test(`${sub} ${title}`)) fuel = "كهربائي";
    else if (/هجين|hybrid/i.test(`${sub} ${title}`)) fuel = "هجين";
    else if (/ديزل|diesel/i.test(`${sub} ${title}`)) fuel = "ديزل";
  }

  let regionalSpecs = String(specs.regionalSpecs ?? car?.regionalSpecs ?? "");
  if (!regionalSpecs && listing.features?.some((f) => /خليجي|GCC/i.test(f))) {
    regionalSpecs = "خليجي";
  }

  const conditionRaw =
    (typeof specs.condition === "string" ? specs.condition : "") ||
    listing.condition ||
    "";
  const condition =
    CONDITION_LABELS[conditionRaw] ??
    (conditionRaw &&
    !["excellent", "new", "used", "refurbished", "for_parts", "not_working"].includes(
      conditionRaw,
    )
      ? conditionRaw
      : CONDITION_LABELS[listing.condition] ?? "");

  return {
    year:
      typeof specs.year === "string" || typeof specs.year === "number"
        ? String(specs.year)
        : yearFromTitle,
    mileageLabel,
    condition,
    transmission: String(specs.transmission ?? car?.transmission ?? ""),
    fuel,
    regionalSpecs,
  };
}

export function getListingFeatureItems(listing: Listing): string[] {
  if (listing.features?.length) {
    return listing.features;
  }
  if (listing.categorySpecs?.features) {
    const raw = listing.categorySpecs.features;
    if (typeof raw === "string") {
      return raw.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

export function listingMatchesQuery(listing: Listing, query: string): boolean {
  const normalized = query.trim();
  if (!normalized) return true;

  const specValues = listing.categorySpecs
    ? Object.entries(listing.categorySpecs)
        .filter(([key]) => key !== "features")
        .map(([, value]) => String(value))
    : [];

  const haystack = [
    listing.title,
    listing.titleEnglish,
    listing.description,
    listing.descriptionEnglish,
    listing.city,
    listing.emirate,
    listing.area,
    listing.subcategory,
    listing.seller.name,
    ...specValues,
    ...(listing.features ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  if (searchTextMatches(haystack, normalized)) return true;

  const categoryKeywords = CATEGORY_SEARCH_KEYWORDS[listing.categoryId] ?? [];
  return categoryKeywords.some(
    (keyword) =>
      searchTextMatches(keyword, normalized) ||
      searchTextMatches(normalized, keyword),
  );
}
