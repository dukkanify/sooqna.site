/** Admin listings desk query: `?status=` must not fall back to marketplace. */

export const ADMIN_LISTINGS_DEFAULT_STATUS = "marketplace";

export const ADMIN_LISTINGS_STATUS_FILTERS = [
  "marketplace",
  "all",
  "featured",
  "pending_review",
  "active",
  "reserved",
  "sold",
  "rejected",
  "draft",
  "expired",
  "demo",
] as const;

export type AdminListingsStatusFilter =
  (typeof ADMIN_LISTINGS_STATUS_FILTERS)[number];

const STATUS_SET = new Set<string>(ADMIN_LISTINGS_STATUS_FILTERS);

/** Dashboard / ops links use pending_review; accept pending as an alias. */
export function parseAdminListingsStatusFilter(
  raw: string | null | undefined,
): AdminListingsStatusFilter {
  const value = raw?.trim() ?? "";
  if (value === "pending") return "pending_review";
  if (STATUS_SET.has(value)) return value as AdminListingsStatusFilter;
  return ADMIN_LISTINGS_DEFAULT_STATUS;
}

export function listingMatchesAdminStatusFilter(input: {
  featuredLive: boolean;
  isDemo: boolean;
  isMarketplace: boolean;
  status: string;
  statusFilter: string;
}): boolean {
  const { featuredLive, isDemo, isMarketplace, status, statusFilter } = input;
  if (statusFilter === "demo") return isDemo;
  if (statusFilter === "marketplace") return isMarketplace;
  if (statusFilter === "all") return true;
  if (statusFilter === "featured") return isMarketplace && featuredLive;
  // Pending/rejected/draft/etc. are real marketplace ads — never require the
  // default "marketplace" bucket (which is all statuses mixed together).
  return status === statusFilter && isMarketplace;
}
