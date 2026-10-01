import { AdminWalletsPanel } from "@/features/admin/components/AdminWalletsPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminWalletsPage() {
  return (
    <AdminShell
      activePath="/admin/wallets"
      description="دفتر المحافظ الحقيقي — أرصدة متاحة ومحجوزة بدون حسابات أو دفعات تجريبية."
      title="المحافظ"
    >
      <AdminWalletsPanel />
    </AdminShell>
  );
}
