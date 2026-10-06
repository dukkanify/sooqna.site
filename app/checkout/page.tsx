import { CheckoutWizard } from "@/features/checkout/components/CheckoutWizard";
import { getAdminSettings } from "@/services/admin/admin-settings-store";
import { resolveServerListing } from "@/services/payments/listing-resolver";
import { resolveOrderFeeRates } from "@/shared/payments/order-fees";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";

export const dynamic = "force-dynamic";

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
  const catalogListing = listingRef
    ? await resolveServerListing(listingRef)
    : undefined;
  const settings = await getAdminSettings({ fresh: true });
  const feeRates = resolveOrderFeeRates(settings);

  return (
    <>
      <SiteHeader />
      <main>
        <CheckoutWizard
          catalogListing={catalogListing}
          feeRates={feeRates}
          fromOrderId={params.fromOrder}
          listingRef={listingRef}
          paymentCancelled={params.payment === "cancelled"}
        />
      </main>
      <SiteFooter />
    </>
  );
}
