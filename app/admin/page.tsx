import { AdminOpsCockpit } from "@/features/admin/components/AdminOpsCockpit";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminPage() {
  return (
    <AdminShell
      activePath="/admin"
      description="ملخص تشغيلي حي: أداء المنصة، المالية، طوابير المراجعة، والنزاعات — مع إجراءات فورية."
      title="لوحة التحكم"
    >
      <AdminOpsCockpit />
    </AdminShell>
  );
}
