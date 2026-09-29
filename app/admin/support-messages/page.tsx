import { Suspense } from "react";
import { AdminSupportMessagesPanel } from "@/features/admin/components/AdminSupportMessagesPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminSupportMessagesPage() {
  return (
    <AdminShell
      activePath="/admin/support-messages"
      description="رسائل نموذج «تواصل معنا» — الاسم والبريد والموضوع والحالة وتاريخ الاستلام."
      title="صندوق تواصل معنا"
    >
      <Suspense fallback={<p className="text-sm text-muted">جاري التحميل...</p>}>
        <AdminSupportMessagesPanel />
      </Suspense>
    </AdminShell>
  );
}
