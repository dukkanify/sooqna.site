import { AdminLocationsPanel } from "@/features/admin/components/AdminLocationsPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminLocationsPage() {
  return (
    <AdminShell
      activePath="/admin/locations"
      description="أضف مدينة بسرعة، وعدّل الاسم أو الإمارة أو الترتيب من البطاقة مباشرة."
      title="المواقع / المدن"
    >
      <AdminLocationsPanel />
    </AdminShell>
  );
}
