import { Suspense } from "react";
import { AdminListingReportsPanel } from "@/features/admin/components/AdminListingReportsPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminListingReportsPage() {
  return (
    <AdminShell
      activePath="/admin/listing-reports"
      description="بلاغات الإعلانات من الزوار والمستخدمين — أغلق، أخفِ الإعلان، أو أوقف البائع من نفس الشاشة."
      title="بلاغات الإعلانات"
    >
      <Suspense fallback={<p className="text-sm text-muted">جاري التحميل...</p>}>
        <AdminListingReportsPanel />
      </Suspense>
    </AdminShell>
  );
}
