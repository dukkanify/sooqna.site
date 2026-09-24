import { cache } from "react";
import { mockCategories } from "@/mock/categories.mock";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";
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
import {
  LISTINGS_CACHE_TAG,
  CATEGORY_COUNTS_REVALIDATE_SECONDS,
  bumpCategoriesCache,
} from "@/services/listings/listings-cache";
import { unstable_cache } from "next/cache";
import {
  BUILTIN_CATEGORY_PROFILES,
  getCategoryFeatureProfileMeta,
  getFormTemplateFields,
  resolveCategoryFeatureProfile,
  slugifyCategoryName,
  type CategoryFeatureProfile,
} from "@/shared/constants/category-feature-profiles";
import { replaceCategoryFormFields } from "@/services/admin/category-form-store";

type StoredCategory = Category & {
  enabled: boolean;
  sortOrder: number;
  featureProfile?: CategoryFeatureProfile;
};

/**
 * Durable categories (incl. فروع / subcategories): Postgres JSONB on Vercel,
 * local durable file when Postgres is unavailable — same pattern as form fields.
 * Previously used ephemeral /tmp `categories.json`, so admin edits vanished on
 * other instances and the publish wizard re-seeded mock subcategories.
 */
const store = createPayloadCollectionStore<StoredCategory>({
  table: "categories",
  fileName: "sooqna-categories.json",
});

let cacheRows: StoredCategory[] | null = null;
let inflight: Promise<StoredCategory[]> | null = null;

/** Trim, drop empties, and dedupe while preserving first-seen order. */
function normalizeSubcategories(input?: string[] | null): string[] {
  if (!input?.length) return [];
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of input) {
    const value = String(raw ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    next.push(value);
  }
  return next;
}

function seedCategories(): StoredCategory[] {
  return mockCategories.map((category, index) => ({
    ...category,
    listingCount: 0,
    enabled: true,
    sortOrder: index + 1,
    featureProfile:
      category.featureProfile ??
      BUILTIN_CATEGORY_PROFILES[category.id] ??
      "general",
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

function withResolvedProfile(row: StoredCategory): StoredCategory {
  return {
    ...row,
    featureProfile: resolveCategoryFeatureProfile(row.id, row.featureProfile),
  };
}

async function persistCategories(rows: StoredCategory[]) {
  await store.replaceAll(rows);
  setCache(rows);
  bumpCategoriesCache();
}

async function loadCategoryRecordsUncached(): Promise<StoredCategory[]> {
  // Vercel instances keep module state. Stale cacheRows hide category/subcategory
  // edits saved by another instance (same pattern as listing-store).
  if (process.env.VERCEL) {
    cacheRows = null;
  }

  if (cacheRows) return cloneCategories(cacheRows);

  if (!inflight) {
    inflight = (async () => {
      const stored = await store.listAll().catch(() => [] as StoredCategory[]);
      if (stored.length === 0) {
        const seeded = seedCategories();
        await store.replaceAll(seeded);
        return setCache(seeded);
      }
      return setCache(
        stored.map((row, index) =>
          withResolvedProfile({
            ...row,
            subcategories: normalizeSubcategories(row.subcategories),
            sortOrder:
              typeof row.sortOrder === "number" ? row.sortOrder : index + 1,
          }),
        ),
      );
    })().finally(() => {
      inflight = null;
    });
  }

  return cloneCategories(await inflight);
}

export const getAllCategoryRecords = cache(
  async (): Promise<StoredCategory[]> => {
    return loadCategoryRecordsUncached();
  },
);

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
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"),
    )
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      listingCount: counts.get(category.id) ?? 0,
      subcategories: [...category.subcategories],
      imageUrl: category.imageUrl,
      featuredListingSlug: category.featuredListingSlug,
      featureProfile: resolveCategoryFeatureProfile(
        category.id,
        category.featureProfile,
      ),
    }));
});

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | undefined> {
  const categories = await getEnabledCategories();
  return categories.find((category) => category.slug === slug);
}

export async function getCategoryById(
  id: string,
): Promise<Category | undefined> {
  const categories = await getEnabledCategories();
  return categories.find((category) => category.id === id);
}

export async function getAdminCategoryRecords(): Promise<AdminCategoryRecord[]> {
  const [categories, counts] = await Promise.all([
    getAllCategoryRecords(),
    countListingsByCategory(undefined, { includeFixtures: true }),
  ]);

  return categories
    .slice()
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"),
    )
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      listingCount: counts.get(category.id) ?? 0,
      enabled: category.enabled,
      sortOrder: category.sortOrder,
      subcategories: [...category.subcategories],
      featureProfile: resolveCategoryFeatureProfile(
        category.id,
        category.featureProfile,
      ),
    }));
}

async function seedFormForProfile(
  categoryId: string,
  profile: CategoryFeatureProfile,
) {
  const defaults = getFormTemplateFields(profile);
  if (defaults.length === 0) return;
  await replaceCategoryFormFields(
    categoryId,
    defaults.map((field, index) => ({
      fieldKey: field.key,
      label: field.label,
      type: field.type,
      required: Boolean(field.required),
      enabled: true,
      sortOrder: index,
      placeholder: field.placeholder,
      note: field.note,
      options: field.options,
      showWhen: field.showWhen,
      titlePart: field.titlePart,
      searchable: field.searchable,
    })),
  );
}

export async function createCategoryRecord(
  input: AdminCategoryCreateInput,
): Promise<AdminCategoryRecord> {
  const categories = await loadCategoryRecordsUncached();
  const slug = (input.slug.trim() || slugifyCategoryName(input.name))
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    throw new Error("INVALID_SLUG");
  }
  if (categories.some((row) => row.slug === slug || row.id === slug)) {
    throw new Error("SLUG_TAKEN");
  }

  const profile = resolveCategoryFeatureProfile(
    slug,
    input.featureProfile ?? "general",
  );
  const meta = getCategoryFeatureProfileMeta(profile);
  const maxOrder = categories.reduce(
    (max, row) => Math.max(max, row.sortOrder ?? 0),
    0,
  );
  const subcategories = normalizeSubcategories(input.subcategories);
  const record: StoredCategory = {
    id: slug,
    name: input.name.trim(),
    slug,
    icon: input.icon ?? meta.defaultIcon,
    listingCount: 0,
    subcategories,
    enabled: true,
    sortOrder: input.sortOrder ?? maxOrder + 1,
    featureProfile: profile,
  };
  categories.unshift(record);
  await persistCategories(categories);

  if (input.seedForm !== false) {
    await seedFormForProfile(record.id, profile);
  }

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    icon: record.icon,
    listingCount: 0,
    enabled: true,
    sortOrder: record.sortOrder,
    subcategories: [...subcategories],
    featureProfile: profile,
  };
}

export async function patchCategoryRecord(
  id: string,
  patch: AdminCategoryPatch,
): Promise<AdminCategoryRecord | undefined> {
  const categories = await loadCategoryRecordsUncached();
  const index = categories.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  const previousProfile = resolveCategoryFeatureProfile(
    id,
    categories[index].featureProfile,
  );
  const { reseedForm, subcategories: patchSubs, ...persistPatch } = patch;
  const nextProfile =
    persistPatch.featureProfile !== undefined
      ? resolveCategoryFeatureProfile(id, persistPatch.featureProfile)
      : categories[index].featureProfile;
  const nextSubcategories =
    patchSubs !== undefined
      ? normalizeSubcategories(patchSubs)
      : [...categories[index].subcategories];
  categories[index] = {
    ...categories[index],
    ...persistPatch,
    featureProfile: nextProfile,
    subcategories: nextSubcategories,
  };
  await persistCategories(categories);
  const row = categories[index];
  const resolvedProfile = resolveCategoryFeatureProfile(row.id, row.featureProfile);
  const profileChanged =
    persistPatch.featureProfile !== undefined &&
    resolvedProfile !== previousProfile;
  if (reseedForm === true || (profileChanged && reseedForm !== false)) {
    await seedFormForProfile(row.id, resolvedProfile);
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    listingCount: row.listingCount,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    subcategories: [...row.subcategories],
    featureProfile: resolvedProfile,
  };
}

export async function deleteCategoryRecord(id: string): Promise<boolean> {
  const categories = await loadCategoryRecordsUncached();
  const next = categories.filter((item) => item.id !== id);
  if (next.length === categories.length) return false;
  await persistCategories(next);
  try {
    await replaceCategoryFormFields(id, []);
  } catch {
    /* form cleanup is optional */
  }
  return true;
}
