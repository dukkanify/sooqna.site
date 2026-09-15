import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { requireCurrentUser } from "@/services/profile";

export default async function WalletStripeRefreshPage() {
  const user = await requireCurrentUser("/wallet/stripe/refresh");

  return (
    <>
      <SiteHeader />
      <main>
        <DashboardShell
          activePath="/wallet"
          description="أكمل ربط حساب الاستلام لاستلام مبالغ الضمان."
          title="المحفظة"
          user={user}
        >
          <Card className="grid gap-4 p-6" variant="flat">
            <div>
              <h2 className="text-base font-semibold text-ink">لم يكتمل إعداد Stripe</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                انتهت جلسة الإعداد أو أُغلقت قبل الإكمال. ارجع للمحفظة وأعد المحاولة من زر
                «ربط حساب الاستلام».
              </p>
            </div>
            <Button href="/wallet?connect=refresh" variant="primary">
              العودة للمحفظة وإعادة المحاولة
            </Button>
          </Card>
        </DashboardShell>
      </main>
      <SiteFooter />
    </>
  );
}
