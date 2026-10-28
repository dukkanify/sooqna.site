import { getCategories } from "@/services/categories";
import { toDesktopCategoryNavItems } from "@/shared/navigation/desktop-category-nav";
import { DesktopCategoryMenu } from "@/features/navigation/desktop/DesktopCategoryMenu";

/**
 * Server entry for the desktop category rail.
 * Fetches durable categories and passes a serializable tree to the client menu.
 */
export async function DesktopCategoryNav() {
  const categories = await getCategories();
  const items = toDesktopCategoryNavItems(categories);
  if (items.length === 0) return null;
  return <DesktopCategoryMenu categories={items} />;
}
