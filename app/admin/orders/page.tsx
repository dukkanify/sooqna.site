import { Suspense } from "react";
import { AdminOrdersPanel } from "@/features/admin/components/AdminOrdersPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminOrdersPage() {
  return (
    <AdminShell
      activePath="/admin/orders"
      description="تفاصيل الطلب والإجراءات الإدارية داخل اللوحة — دون التحويل لرحلة المشتري أو الدفع في الموقع."
      title="الطلبات والمدفوعات"
    >
      <Suspense fallback={<p className="text-sm text-muted">جاري التحميل...</p>}>
        <AdminOrdersPanel />
      </Suspense>
    </AdminShell>
  );
}
