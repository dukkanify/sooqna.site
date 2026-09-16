import { AdminOpsCockpit } from "@/features/admin/components/AdminOpsCockpit";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminPage() {
  return (
    <AdminShell
      activePath="/admin"
      description="ملخص سريع وما يحتاج متابعتك الآن."
      title="الرئيسية"
    >
      <AdminOpsCockpit />
    </AdminShell>
  );
}
