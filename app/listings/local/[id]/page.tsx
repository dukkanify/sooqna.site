import { redirect, notFound } from "next/navigation";
import { LocalListingDetails } from "@/features/listings/components/LocalListingDetails";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { getCategories } from "@/services/categories";
import { getListingById } from "@/services/listings/listing-store";
import { getValidSessionUser } from "@/services/auth/require-session";
import { isConfirmedFixtureListing } from "@/services/listings/mock-catalog-policy";
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
    const isOwner = Boolean(session && stored.seller.id === session.id);
    const isAdmin = session?.role === "admin";
    const hidden =
      isConfirmedFixtureListing(stored) || isShowcaseListing(stored);
    if (hidden && !isOwner && !isAdmin) {
      notFound();
    }
    if (stored.status !== "active" && !isOwner && !isAdmin) {
      notFound();
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
