import type { Listing } from "@/types";

/** Canonical job subcategories: vacancy vs seeker (not industry specialties). */
export const JOB_SUBCATEGORY_VACANCY = "توظيف (وظائف)";
export const JOB_SUBCATEGORY_SEEKER = "باحثون عن عمل";

export const JOB_SUBCATEGORIES = [
  JOB_SUBCATEGORY_VACANCY,
  JOB_SUBCATEGORY_SEEKER,
] as const;

export type JobListingType = "vacancy" | "seeker";

const LEGACY_SPECIALTY_SUBS = new Set([
  "مبيعات",
  "عقارات",
  "توصيل",
  "محاسبة",
  "تصميم",
  "سائقين",
  "رعاية صحية",
  "هندسة",
  "وظائف شاغرة",
  "شاغر وظيفي",
  "باحث عن عمل",
]);

export function isJobsCategoryId(categoryId: string | undefined | null): boolean {
  return categoryId === "jobs";
}

export function subcategoryFromListingType(
  listingType: string | undefined | null,
): string {
  return listingType === "seeker"
    ? JOB_SUBCATEGORY_SEEKER
    : JOB_SUBCATEGORY_VACANCY;
}

export function listingTypeFromSubcategory(
  subcategory: string | undefined | null,
): JobListingType {
  const value = String(subcategory ?? "").trim();
  if (
    value === JOB_SUBCATEGORY_SEEKER ||
    value.includes("باحث") ||
    /^seeker$/i.test(value)
  ) {
    return "seeker";
  }
  return "vacancy";
}

export function isCanonicalJobSubcategory(
  subcategory: string | undefined | null,
): boolean {
  const value = String(subcategory ?? "").trim();
  return (
    value === JOB_SUBCATEGORY_VACANCY || value === JOB_SUBCATEGORY_SEEKER
  );
}

/**
 * Align jobs listing subcategory + listingType without dropping prior specialty text.
 * Old industry subs (مبيعات, …) move into categorySpecs.specialty when needed.
 */
export function migrateJobsListingFields<T extends Listing>(listing: T): T {
  if (!isJobsCategoryId(listing.categoryId)) return listing;

  const specs = { ...(listing.categorySpecs ?? {}) };
  const rawType = String(specs.listingType ?? "").trim().toLowerCase();
  const rawSub = String(listing.subcategory ?? "").trim();

  let listingType: JobListingType =
    rawType === "seeker" || rawType === "vacancy"
      ? (rawType as JobListingType)
      : listingTypeFromSubcategory(rawSub);

  // Title/description heuristic when type/sub are missing or still specialty-only.
  if (
    listingType === "vacancy" &&
    !isCanonicalJobSubcategory(rawSub) &&
    (rawSub.includes("باحث") ||
      /باحث\s*عن\s*عمل|seeking\s*work|job\s*seeker/i.test(
        `${listing.title} ${listing.description ?? ""}`,
      ))
  ) {
    listingType = "seeker";
  }

  const nextSub = subcategoryFromListingType(listingType);

  if (
    rawSub &&
    !isCanonicalJobSubcategory(rawSub) &&
    !specs.specialty &&
    (LEGACY_SPECIALTY_SUBS.has(rawSub) || rawSub.length > 0)
  ) {
    specs.specialty = rawSub;
  }

  specs.listingType = listingType;

  const changed =
    listing.subcategory !== nextSub ||
    listing.categorySpecs?.listingType !== listingType ||
    listing.categorySpecs?.specialty !== specs.specialty;

  if (!changed) return listing;

  return {
    ...listing,
    subcategory: nextSub,
    categorySpecs: specs,
  };
}

/** Ensure durable/admin jobs category exposes only the two type-based subs. */
export function ensureJobsCategorySubcategories(
  subcategories: string[] | undefined | null,
): string[] {
  const current = (subcategories ?? []).map((item) => String(item).trim());
  const hasVacancy = current.includes(JOB_SUBCATEGORY_VACANCY);
  const hasSeeker = current.includes(JOB_SUBCATEGORY_SEEKER);
  if (
    hasVacancy &&
    hasSeeker &&
    current.length === 2 &&
    current[0] === JOB_SUBCATEGORY_VACANCY &&
    current[1] === JOB_SUBCATEGORY_SEEKER
  ) {
    return current;
  }
  return [...JOB_SUBCATEGORIES];
}
