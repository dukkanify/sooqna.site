import { Suspense } from "react";
import { AdminListingsPanel } from "@/features/admin/components/AdminListingsPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminListingsPage() {
  return (
    <AdminShell
      activePath="/admin/listings"
      description="جدول منظم: رقم الإعلان، العنوان، التصنيف، المعلن، الحالة، السعر، تاريخ النشر، المشاهدات والإجراءات — مع بحث وفلاتر."
      title="إدارة الإعلانات"
    >
      <Suspense fallback={<p className="text-sm text-muted">جاري التحميل...</p>}>
        <AdminListingsPanel />
      </Suspense>
    </AdminShell>
  );
}
