import { AdminCategoriesWorkspace } from "@/features/admin/components/AdminCategoriesWorkspace";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminCategoriesPage() {
  return (
    <AdminShell
      activePath="/admin/categories"
      description="كل الأقسام بسطور عرض كاملة — رتّب بالأسهم وعدّل عند الحاجة."
      title="التصنيفات"
    >
      <AdminCategoriesWorkspace />
    </AdminShell>
  );
}
