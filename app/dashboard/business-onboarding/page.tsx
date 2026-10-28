import { BusinessOnboardingForm } from "@/features/auth/components/BusinessOnboardingForm";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { requireCurrentUser } from "@/services/profile";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteChrome } from "@/shared/layouts/SiteChrome";

export default async function BusinessOnboardingPage() {
  const user = await requireCurrentUser("/dashboard/business-onboarding");

  return (
    <>
      <SiteChrome />
      <main>
        <DashboardShell
          activePath="/dashboard/business-onboarding"
          description="أكمل بيانات نشاطك التجاري بعد التحقق من البريد الإلكتروني."
          title="إعداد الحساب التجاري"
          user={user}
        >
          <BusinessOnboardingForm />
        </DashboardShell>
      </main>
      <SiteFooter />
    </>
  );
}
