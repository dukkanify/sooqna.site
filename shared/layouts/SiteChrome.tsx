import { DesktopCategoryNav } from "@/features/navigation/desktop/DesktopCategoryNav";
import { SiteHeader } from "@/shared/layouts/SiteHeader";

/**
 * Standard storefront chrome: existing SiteHeader plus desktop-only category rail.
 * Use from Server Components (pages). Error boundaries keep bare SiteHeader.
 */
export async function SiteChrome() {
  return (
    <>
      <SiteHeader />
      <DesktopCategoryNav />
    </>
  );
}
