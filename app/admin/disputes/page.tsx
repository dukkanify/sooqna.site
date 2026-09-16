import { AdminDisputesPanel } from "@/features/admin/components/AdminDisputesPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminDisputesPage() {
  return (
    <AdminShell
      activePath="/admin/disputes"
      description="مكتب النزاعات: أدلة، طلب معلومات، وقرار مع أثر مالي واضح."
      title="النزاعات"
    >
      <AdminDisputesPanel />
    </AdminShell>
  );
}
