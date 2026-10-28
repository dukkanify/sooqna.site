/** Serializable nav node for the desktop category menu (safe for client props). */
export type DesktopCategoryNavLink = {
  name: string;
  href: string;
};

export type DesktopCategoryNavGroup = {
  title: string;
  items: DesktopCategoryNavLink[];
};

export type DesktopCategoryNavItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  href: string;
  subcategories: DesktopCategoryNavLink[];
  /** Vertical dropdown sections — derived only from real subcategory labels. */
  groups: DesktopCategoryNavGroup[];
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

/**
 * Group flat subcategories when labels already encode rent/sale facets.
 * Never invents subcategory names — only section titles from observed patterns.
 */
export function groupCategorySubcategories(
  parentName: string,
  subcategories: DesktopCategoryNavLink[],
): DesktopCategoryNavGroup[] {
  if (subcategories.length === 0) {
    return [{ title: parentName, items: [] }];
  }

  const rent: DesktopCategoryNavLink[] = [];
  const sale: DesktopCategoryNavLink[] = [];
  const rest: DesktopCategoryNavLink[] = [];

  for (const item of subcategories) {
    if (/للإيجار|للايجار|for\s*rent/i.test(item.name)) {
      rent.push(item);
    } else if (/للبيع|for\s*sale/i.test(item.name)) {
      sale.push(item);
    } else {
      rest.push(item);
    }
  }

  const multiFacet = rent.length > 0 && sale.length > 0;
  if (!multiFacet) {
    return [{ title: parentName, items: subcategories }];
  }

  const groups: DesktopCategoryNavGroup[] = [];
  if (rent.length > 0) {
    groups.push({ title: `${parentName} للإيجار`, items: rent });
  }
  if (sale.length > 0) {
    groups.push({ title: `${parentName} للبيع`, items: sale });
  }
  if (rest.length > 0) {
    groups.push({ title: parentName, items: rest });
  }
  return groups;
}

/** Map durable categories into a client-safe navigation tree. */
export function toDesktopCategoryNavItems(
  categories: readonly CategoryNavSource[],
): DesktopCategoryNavItem[] {
  return categories.map((category) => {
    const subcategories = (category.subcategories ?? [])
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name))
      .map((name) => ({
        name,
        href: branchHref(category.slug, name),
      }));

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      href: `/categories/${category.slug}`,
      subcategories,
      groups: groupCategorySubcategories(category.name, subcategories),
    };
  });
}
