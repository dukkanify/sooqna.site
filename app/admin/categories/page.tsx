import { AdminCategoriesWorkspace } from "@/features/admin/components/AdminCategoriesWorkspace";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminCategoriesPage() {
  return (
    <AdminShell
      activePath="/admin/categories"
      description="جدول منظم للأقسام: الاسم، الترتيب، الحالة، والإجراءات — مع بحث وتعديل مباشر."
      title="التصنيفات"
    >
      <AdminCategoriesWorkspace />
    </AdminShell>
  );
}
