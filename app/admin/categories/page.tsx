import { AdminCategoriesWorkspace } from "@/features/admin/components/AdminCategoriesWorkspace";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminCategoriesPage() {
  return (
    <AdminShell
      activePath="/admin/categories"
      description="أقسام السوق بشبكة بوكسات — رتّب بالأسهم وعدّل عند الحاجة."
      title="التصنيفات"
    >
      <AdminCategoriesWorkspace />
    </AdminShell>
  );
}
