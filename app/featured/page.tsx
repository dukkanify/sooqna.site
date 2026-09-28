import type { Metadata } from "next";
import { FeaturedListingsView } from "@/features/featured/FeaturedListingsView";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { getAdminSettings } from "@/services/admin/admin-settings-store";
import { getCategories } from "@/services/categories";
import { getFeaturedListings } from "@/services/listings";
import { getRequestLocale } from "@/shared/i18n/locale";
import { localizedMetadata } from "@/shared/i18n/localized-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata({
    title: "إعلانات مميزة",
    description:
      "تصفّح إعلانات سوقنا التي فعّل أصحابها باقة التمييز المدفوعة لظهور أوضح خلال مدة الباقة.",
  });
}

export default async function FeaturedPage() {
  const [categories, listings, locale, settings] = await Promise.all([
    getCategories(),
    getFeaturedListings(),
    getRequestLocale(),
    getAdminSettings(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="bg-background">
        <FeaturedListingsView
          categories={categories}
          listings={listings}
          locale={locale}
          packageDays={settings.featuredListingDays}
        />
      </main>
      <SiteFooter />
    </>
  );
}
