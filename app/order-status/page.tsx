import { OrderStatusContent } from "@/features/checkout/components/OrderStatusContent";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteChrome } from "@/shared/layouts/SiteChrome";

type OrderStatusPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function OrderStatusPage({ searchParams }: OrderStatusPageProps) {
  const params = await searchParams;

  return (
    <>
      <SiteChrome />
      <main>
        <OrderStatusContent token={params.token} />
      </main>
      <SiteFooter />
    </>
  );
}
