import { EmptyState } from "@/shared/ui/EmptyState";
import { MarketSectionShell } from "./MarketSectionHeader";

export function MarketCatalogEmpty() {
  return (
    <MarketSectionShell variant="white">
      <EmptyState
        actionHref="/listings/new"
        actionLabel="أضف إعلاناً"
        description="لا نعرض بيانات تجريبية لملء السوق. عندما تتوفر إعلانات حقيقية ستظهر في الرئيسية والبحث والأقسام."
        eyebrow="السوق"
        icon="package"
        title="لا توجد إعلانات متاحة حالياً."
      />
    </MarketSectionShell>
  );
}
