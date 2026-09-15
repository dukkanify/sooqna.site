import { AdminCategoriesPanel } from "@/features/admin/components/AdminCategoriesPanel";
import { AdminCategoryFormsPanel } from "@/features/admin/components/AdminCategoryFormsPanel";
import { AdminVehicleCatalogPanel } from "@/features/admin/components/AdminVehicleCatalogPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminCategoriesPage() {
  return (
    <AdminShell
      activePath="/admin/categories"
      description="إدارة أقسام السوق وتفعيلها أو إيقافها، مع منشئ النماذج الديناميكية وكتالوج السيارات المرجعي."
      title="التصنيفات"
    >
      <div className="grid gap-6">
        <AdminCategoriesPanel />
        <AdminCategoryFormsPanel />
        <AdminVehicleCatalogPanel />
      </div>
    </AdminShell>
  );
}
