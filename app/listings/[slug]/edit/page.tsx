import { ListingEditForm } from "@/features/listings/components/LocalListingEdit";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageHero } from "@/shared/ui/PageHero";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { getListingBySlug } from "@/services/listings";
import { requireCurrentUser } from "@/services/profile";
import { normalizeListingSlugParam } from "@/shared/listings/listing-slug";

type EditListingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const user = await requireCurrentUser("/dashboard/listings");
  const { slug: rawSlug } = await params;
  const slug = normalizeListingSlugParam(rawSlug);
  const listing = await getListingBySlug(slug, { includeFixtures: true });

  const canEdit =
    listing &&
    (listing.seller.id === user.id || user.role === "admin");

  return (
    <>
      <SiteHeader />
      <main className="app-container page-padding section-padding">
        <PageHero
          description={
            canEdit
              ? `عدّل بيانات إعلانك «${listing.title}» — التغييرات تُحفظ في حسابك فوراً.`
              : listing
                ? "لا تملك صلاحية تعديل هذا الإعلان."
                : "الإعلان غير موجود في البيانات الحالية."
          }
          eyebrow="إعلاناتي"
          title="تعديل الإعلان"
        />
        {canEdit && listing ? (
          <ListingEditForm
            initialListing={listing}
            listingId={listing.id}
            mode="server"
          />
        ) : (
          <Card className="p-6">
            <Button href="/dashboard/listings" variant="secondary">
              العودة إلى إعلاناتي
            </Button>
          </Card>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
