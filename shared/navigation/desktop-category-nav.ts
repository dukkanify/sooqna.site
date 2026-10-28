/** Serializable nav node for the desktop category menu (safe for client props). */
export type DesktopCategoryNavItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  href: string;
  subcategories: Array<{
    name: string;
    href: string;
  }>;
};

type CategoryNavSource = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories?: readonly string[] | null;
};

/** Stable branch URL matching `categoryBranchHref` (kept local for node tests). */
function branchHref(slug: string, subcategory?: string): string {
  const trimmed = subcategory?.trim();
  if (!trimmed) return `/categories/${slug}`;
  return `/categories/${slug}?subcategory=${encodeURIComponent(trimmed)}`;
}

/** Map durable categories into a client-safe navigation tree. */
export function toDesktopCategoryNavItems(
  categories: readonly CategoryNavSource[],
): DesktopCategoryNavItem[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    href: `/categories/${category.slug}`,
    subcategories: (category.subcategories ?? [])
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name))
      .map((name) => ({
        name,
        href: branchHref(category.slug, name),
      })),
  }));
}
