import { CheckoutWizard } from "@/features/checkout/components/CheckoutWizard";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import {
  getServerListingById,
  getServerListingBySlug,
  hydrateListingCatalog,
} from "@/services/payments/listing-resolver";

type CheckoutPageProps = {
  searchParams: Promise<{
    listing?: string;
    listingId?: string;
    payment?: string;
    fromOrder?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const listingRef = params.listingId ?? params.listing;
  let catalogListing;
  if (listingRef && !listingRef.startsWith("local-")) {
    await hydrateListingCatalog();
    catalogListing =
      getServerListingById(listingRef) ?? getServerListingBySlug(listingRef);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <CheckoutWizard
          catalogListing={catalogListing}
          fromOrderId={params.fromOrder}
          listingRef={listingRef}
          paymentCancelled={params.payment === "cancelled"}
        />
      </main>
      <SiteFooter />
    </>
  );
}
