import { cache } from "react";
import { mockCategories } from "@/mock/categories.mock";
import { loadCollection, saveCollection } from "@/services/payments/data-store";
import type { Category } from "@/types";
import type {
  AdminCategoryCreateInput,
  AdminCategoryPatch,
  AdminCategoryRecord,
} from "@/types/domain/admin";
import {
  countListingsByCategory,
  countActiveListingsByCategory,
} from "@/services/listings/listing-queries";
import { LISTINGS_CACHE_TAG, CATEGORY_COUNTS_REVALIDATE_SECONDS } from "@/services/listings/listings-cache";
import { unstable_cache } from "next/cache";

const FILE = "categories.json";

type StoredCategory = Category & { enabled: boolean; sortOrder: number };

let cacheRows: StoredCategory[] | null = null;
let inflight: Promise<StoredCategory[]> | null = null;

function seedCategories(): StoredCategory[] {
  return mockCategories.map((category, index) => ({
    ...category,
    listingCount: 0,
    enabled: true,
    sortOrder: index + 1,
  }));
}

function cloneCategories(rows: StoredCategory[]) {
  return rows.map((row) => ({
    ...row,
    subcategories: [...row.subcategories],
  }));
}

function setCache(rows: StoredCategory[]) {
  cacheRows = cloneCategories(rows);
  return cacheRows;
}

async function loadCategoryRecordsUncached(): Promise<StoredCategory[]> {
  if (cacheRows) return cloneCategories(cacheRows);

  if (!inflight) {
    inflight = (async () => {
      const stored = await loadCollection<StoredCategory>(FILE).catch(
        () => [] as StoredCategory[],
      );
      if (stored.length === 0) {
        const seeded = seedCategories();
        await saveCollection(FILE, seeded);
        return setCache(seeded);
      }
      return setCache(
        stored.map((row, index) => ({
          ...row,
          sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : index + 1,
        })),
      );
    })().finally(() => {
      inflight = null;
    });
  }

  return cloneCategories(await inflight);
}

export const getAllCategoryRecords = cache(async (): Promise<StoredCategory[]> => {
  return loadCategoryRecordsUncached();
});

const getActiveListingCountsCached = unstable_cache(
  async () => {
    const counts = await countActiveListingsByCategory();
    return Object.fromEntries(counts.entries());
  },
  ["sooqna-category-counts-v3"],
  { revalidate: CATEGORY_COUNTS_REVALIDATE_SECONDS, tags: [LISTINGS_CACHE_TAG] },
);

export const getEnabledCategories = cache(async (): Promise<Category[]> => {
  const [categories, countRecord] = await Promise.all([
    getAllCategoryRecords(),
    getActiveListingCountsCached(),
  ]);
  const counts = new Map(Object.entries(countRecord));

  return categories
    .filter((category) => category.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      listingCount: counts.get(category.id) ?? 0,
      subcategories: [...category.subcategories],
    }));
});

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | undefined> {
  const categories = await getEnabledCategories();
  return categories.find((category) => category.slug === slug);
}

export async function getAdminCategoryRecords(): Promise<AdminCategoryRecord[]> {
  const [categories, counts] = await Promise.all([
    getAllCategoryRecords(),
    countListingsByCategory(undefined, { includeFixtures: true }),
  ]);

  return categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"))
    .map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    listingCount: counts.get(category.id) ?? 0,
    enabled: category.enabled,
    sortOrder: category.sortOrder,
    subcategories: [...category.subcategories],
  }));
}

export async function createCategoryRecord(
  input: AdminCategoryCreateInput,
): Promise<AdminCategoryRecord> {
  const categories = await loadCategoryRecordsUncached();
  const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
  const maxOrder = categories.reduce(
    (max, row) => Math.max(max, row.sortOrder ?? 0),
    0,
  );
  const record: StoredCategory = {
    id: `cat-${Date.now()}`,
    name: input.name.trim(),
    slug,
    icon: input.icon ?? "wrench",
    listingCount: 0,
    subcategories: [],
    enabled: true,
    sortOrder: input.sortOrder ?? maxOrder + 1,
  };
  categories.unshift(record);
  await saveCollection(FILE, categories);
  setCache(categories);
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    icon: record.icon,
    listingCount: 0,
    enabled: true,
    sortOrder: record.sortOrder,
    subcategories: [],
  };
}

export async function patchCategoryRecord(
  id: string,
  patch: AdminCategoryPatch,
): Promise<AdminCategoryRecord | undefined> {
  const categories = await loadCategoryRecordsUncached();
  const index = categories.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  categories[index] = {
    ...categories[index],
    ...patch,
    subcategories: [...categories[index].subcategories],
  };
  await saveCollection(FILE, categories);
  setCache(categories);
  const row = categories[index];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    listingCount: row.listingCount,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    subcategories: [...row.subcategories],
  };
}
