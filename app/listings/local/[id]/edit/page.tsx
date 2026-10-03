import { redirect } from "next/navigation";
import { ListingEditForm } from "@/features/listings/components/LocalListingEdit";
import { PageHero } from "@/shared/ui/PageHero";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { getListingById } from "@/services/listings/listing-store";
import { getListingEditPath } from "@/shared/listings/listing-url";
import { requireCurrentUser } from "@/services/profile";

type LocalListingEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LocalListingEditPage({
  params,
}: LocalListingEditPageProps) {
  const user = await requireCurrentUser("/dashboard/listings");
  const { id } = await params;
  const stored = await getListingById(id).catch(() => undefined);

  // Synced catalog copy — never keep the seller on the localStorage-only editor.
  if (
    stored &&
    (stored.seller.id === user.id || user.role === "admin")
  ) {
    redirect(getListingEditPath(stored, { synced: true }));
  }

  return (
    <>
      <SiteHeader />
      <main className="app-container page-padding">
        <PageHero
          description="عدّل بيانات إعلانك المحفوظ محلياً. التغييرات ستظهر فوراً في إعلاناتي ونتائج البحث."
          eyebrow="إعلاناتي"
          title="تعديل الإعلان"
        />
        <ListingEditForm listingId={id} mode="local" />
      </main>
      <SiteFooter />
    </>
  );
}
