import { AdminListingsPanel } from "@/features/admin/components/AdminListingsPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminListingsPage() {
  return (
    <AdminShell
      activePath="/admin/listings"
      description="إعلانات السوق الحقيقية أولاً — التجريبي منفصل تحت «تجريبي فقط»."
      title="الإعلانات"
    >
      <AdminListingsPanel />
    </AdminShell>
  );
}
