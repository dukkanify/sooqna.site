import type { Category, Listing } from "@/types";
import {
  genericShowcaseListing,
  getShowcaseCatalogListings,
} from "@/services/listings/showcase-catalog";
import {
  deleteShowcaseListings,
  hideShowcaseListings,
  insertListingsIfMissing,
  getShowcaseCatalogFlag,
  setShowcaseCatalogFlag,
  upsertListingRow,
} from "@/services/listings/listing-persistence";
import { bumpListingsCache } from "@/services/listings/listings-cache";

export type ShowcaseCatalogAction = "publish" | "hide" | "remove";

export type ShowcaseCatalogResult = {
  action: ShowcaseCatalogAction;
  affected: number;
  flag: "published" | "hidden" | "removed";
};

let ensureInflight: Promise<void> | null = null;

function showcaseDisabledByEnv(): boolean {
  return process.env.SOOQNA_SHOWCASE_CATALOG === "false";
}

async function loadEnabledCategories(): Promise<Category[]> {
  const { getAllCategoryRecords } = await import(
    "@/services/categories/category-store"
  );
  const records = await getAllCategoryRecords();
  return records
    .filter((category) => category.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      listingCount: 0,
      subcategories: [...category.subcategories],
    }));
}

export async function listingsForEnabledCategories(
  categories?: Category[],
): Promise<Listing[]> {
  const enabled = categories ?? (await loadEnabledCategories());
  const byCategory = new Map<string, Listing[]>();
  for (const listing of getShowcaseCatalogListings()) {
    const bucket = byCategory.get(listing.categoryId) ?? [];
    bucket.push(listing);
    byCategory.set(listing.categoryId, bucket);
  }

  const out: Listing[] = [];
  for (const category of enabled) {
    const seeded = byCategory.get(category.id);
    if (seeded && seeded.length > 0) {
      out.push(...seeded);
      continue;
    }
    const subs =
      category.subcategories.length > 0 ? category.subcategories : [category.name];
    subs.forEach((subcategory, index) => {
      out.push(
        genericShowcaseListing({
          categoryId: category.id,
          categoryName: category.name,
          subcategory,
          index,
        }),
      );
    });
  }
  return out;
}

async function runEnsure(): Promise<void> {
  if (showcaseDisabledByEnv()) return;
  const flag = await getShowcaseCatalogFlag();
  if (flag === "removed" || flag === "hidden") return;
  const listings = await listingsForEnabledCategories();
  const inserted = await insertListingsIfMissing(listings);
  if (!flag) await setShowcaseCatalogFlag("published");
  if (inserted > 0) bumpListingsCache();
}

/** Insert missing showcase rows only. Never un-hides drafts or restores a removed catalog. */
export async function ensureShowcaseCatalogPublished(): Promise<void> {
  if (showcaseDisabledByEnv()) return;
  if (!ensureInflight) {
    ensureInflight = runEnsure().catch((error) => {
      ensureInflight = null;
      throw error;
    });
  }
  try {
    await ensureInflight;
  } catch {
    // Catalog remain empty rather than failing public reads.
  }
}

export async function publishShowcaseCatalog(): Promise<ShowcaseCatalogResult> {
  const listings = await listingsForEnabledCategories();
  for (const listing of listings) {
    await upsertListingRow({ ...listing, status: "active", isDemo: true });
  }
  await setShowcaseCatalogFlag("published");
  ensureInflight = Promise.resolve();
  bumpListingsCache();
  return { action: "publish", affected: listings.length, flag: "published" };
}

export async function hideShowcaseCatalog(): Promise<ShowcaseCatalogResult> {
  const affected = await hideShowcaseListings();
  await setShowcaseCatalogFlag("hidden");
  bumpListingsCache();
  return { action: "hide", affected, flag: "hidden" };
}

export async function removeShowcaseCatalog(): Promise<ShowcaseCatalogResult> {
  const affected = await deleteShowcaseListings();
  await setShowcaseCatalogFlag("removed");
  bumpListingsCache();
  return { action: "remove", affected, flag: "removed" };
}

export async function runShowcaseCatalogAction(
  action: ShowcaseCatalogAction,
): Promise<ShowcaseCatalogResult> {
  if (action === "hide") return hideShowcaseCatalog();
  if (action === "remove") return removeShowcaseCatalog();
  return publishShowcaseCatalog();
}
