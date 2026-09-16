import { AdminUsersPanel } from "@/features/admin/components/AdminUsersPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminUsersPage() {
  return (
    <AdminShell
      activePath="/admin/users"
      description="اعتمد الحسابات العالقة بضغطة — التفاصيل تحت المزيد."
      title="المستخدمون"
    >
      <AdminUsersPanel />
    </AdminShell>
  );
}
