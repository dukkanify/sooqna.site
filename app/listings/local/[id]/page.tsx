import { redirect, notFound } from "next/navigation";
import { LocalListingDetails } from "@/features/listings/components/LocalListingDetails";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { getCategories } from "@/services/categories";
import { getListingById } from "@/services/listings/listing-store";
import { getValidSessionUser } from "@/services/auth/require-session";
import { isConfirmedFixtureListing } from "@/services/listings/mock-catalog-policy";
import { resolveListingPageAccess } from "@/shared/listings/listing-page-access";
import { isShowcaseListing } from "@/shared/listings/showcase-listing";

type LocalListingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LocalListingPage({
  params,
}: LocalListingPageProps) {
  const [{ id }, categories, session] = await Promise.all([
    params,
    getCategories(),
    getValidSessionUser(),
  ]);

  const stored = await getListingById(id);
  if (stored?.slug) {
    const hidden =
      isConfirmedFixtureListing(stored) || isShowcaseListing(stored);
    const access = resolveListingPageAccess(stored, session);
    // Fixture/showcase rows stay private unless owner/admin.
    if (hidden && access.kind !== "allow") {
      if (access.kind === "login_required") {
        redirect(
          `/login?next=${encodeURIComponent(`/listings/local/${id}`)}`,
        );
      }
      notFound();
    }
    if (access.kind === "not_found") notFound();
    if (access.kind === "login_required") {
      redirect(
        `/login?next=${encodeURIComponent(`/listings/${stored.slug}`)}`,
      );
    }
    // Synced catalog copy — use the canonical slug page (fast, shared cache rules).
    redirect(`/listings/${stored.slug}`);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="app-container page-padding">
          <LocalListingDetails categories={categories} listingId={id} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
