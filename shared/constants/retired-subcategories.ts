/**
 * Subcategories removed from pick-lists (UI + admin) without deleting listing rows.
 * Existing listings are remapped to a still-active sibling when displayed/filtered.
 */

export const RETIRED_CAR_SUBCATEGORY_SPARE_PARTS = "قطع غيار";

/** Official cars bucket that remains selectable for remapped spare-parts ads. */
export const CARS_SUBCATEGORY_REMAP_TARGET = "سيارات مستعملة";

const RETIRED_BY_CATEGORY: Record<string, ReadonlySet<string>> = {
  cars: new Set([RETIRED_CAR_SUBCATEGORY_SPARE_PARTS]),
};

const REMAP_BY_CATEGORY: Record<string, string> = {
  cars: CARS_SUBCATEGORY_REMAP_TARGET,
};

export function isRetiredSubcategory(
  categoryId: string | undefined,
  subcategory: string | undefined,
): boolean {
  if (!categoryId || !subcategory?.trim()) return false;
  return RETIRED_BY_CATEGORY[categoryId]?.has(subcategory.trim()) === true;
}

/** Drop retired names from a category's selectable subcategory list. */
export function stripRetiredSubcategories(
  categoryId: string,
  subcategories: string[] | undefined | null,
): string[] {
  const retired = RETIRED_BY_CATEGORY[categoryId];
  const list = Array.isArray(subcategories) ? subcategories : [];
  if (!retired?.size) return [...list];
  return list.filter((name) => !retired.has(String(name ?? "").trim()));
}

/**
 * Map a stored listing subcategory onto a still-active name when retired,
 * so ads keep their data and remain findable under a live filter chip.
 */
export function remapRetiredListingSubcategory(
  categoryId: string | undefined,
  subcategory: string | undefined,
): string | undefined {
  if (!subcategory?.trim()) return subcategory;
  if (!isRetiredSubcategory(categoryId, subcategory)) return subcategory;
  return REMAP_BY_CATEGORY[categoryId!] ?? subcategory;
}
