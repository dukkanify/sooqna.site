import { DesktopCategoryNav } from "@/features/navigation/desktop/DesktopCategoryNav";
import { SiteHeader } from "@/shared/layouts/SiteHeader";

/**
 * Standard storefront chrome: SiteHeader + desktop category rail in one sticky stack.
 * Error boundaries keep bare SiteHeader.
 */
export async function SiteChrome() {
  return (
    <div className="desktop-storefront-sticky sticky top-0 z-50 bg-surface">
      <SiteHeader />
      <DesktopCategoryNav />
    </div>
  );
}
