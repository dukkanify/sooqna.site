import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteHeader } from "@/shared/layouts/SiteHeader";
import { BRAND } from "@/shared/constants/brand";
import { SupportTicketTrackForm } from "@/features/support/components/SupportTicketTrackForm";
import { Card } from "@/shared/ui/Card";
import { PageHero } from "@/shared/ui/PageHero";

export const metadata: Metadata = {
  title: "متابعة طلب التواصل",
  description: `تابع حالة طلب تواصل معنا في ${BRAND.nameAr} برقم الطلب والبريد.`,
};

type TrackPageProps = {
  searchParams: Promise<{ ticket?: string; email?: string }>;
};

export default async function SupportTrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="app-container page-padding">
          <PageHero
            description="أدخل رقم الطلب والبريد الذي أرسلت منه الرسالة لعرض الحالة الحالية."
            eyebrow="الدعم"
            title="متابعة طلب التواصل"
          />

          <Card className="mx-auto mt-8 max-w-lg p-6" variant="flat">
            <SupportTicketTrackForm
              initialEmail={params.email ?? ""}
              initialTicket={params.ticket ?? ""}
            />
            <p className="mt-5 text-sm text-muted">
              ليس لديك رقم طلب؟{" "}
              <Link className="font-semibold text-primary" href="/support">
                أرسل رسالة جديدة
              </Link>
              {" · "}
              أو راجع طلباتك من{" "}
              <Link className="font-semibold text-primary" href="/profile#support-tickets">
                الملف الشخصي
              </Link>
              .
            </p>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
