import { Suspense } from "react";
import { AdminListingsPanel } from "@/features/admin/components/AdminListingsPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminListingsPage() {
  return (
    <AdminShell
      activePath="/admin/listings"
      description="جدول منظم بلا قص للنصوص: رقم الإعلان، العنوان، التصنيف، المعلن، الحالة، التمييز، السعر، تاريخ النشر، المشاهدات والإجراءات — مع بحث وفلاتر ووصول لصفحة المميزة."
      title="إدارة الإعلانات"
    >
      <Suspense fallback={<p className="text-sm text-muted">جاري التحميل...</p>}>
        <AdminListingsPanel />
      </Suspense>
    </AdminShell>
  );
}
