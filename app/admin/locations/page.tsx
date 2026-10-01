import { AdminLocationsPanel } from "@/features/admin/components/AdminLocationsPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminLocationsPage() {
  return (
    <AdminShell
      activePath="/admin/locations"
      description="جدول مواقع منظم: أضف مدينة بسرعة، وعدّل الاسم أو الإمارة أو الترتيب من الصف أو بطاقة الجوال."
      title="المواقع / المدن"
    >
      <AdminLocationsPanel />
    </AdminShell>
  );
}
