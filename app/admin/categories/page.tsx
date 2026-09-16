import { AdminCategoriesWorkspace } from "@/features/admin/components/AdminCategoriesWorkspace";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminCategoriesPage() {
  return (
    <AdminShell
      activePath="/admin/categories"
      description="إدارة الأقسام والشرائح. النماذج وكتالوج السيارات من التبويبات أعلاه."
      title="التصنيفات"
    >
      <AdminCategoriesWorkspace />
    </AdminShell>
  );
}
