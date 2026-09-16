import { AdminCategoriesPanel } from "@/features/admin/components/AdminCategoriesPanel";
import { AdminCategoryFormsPanel } from "@/features/admin/components/AdminCategoryFormsPanel";
import { AdminVehicleCatalogPanel } from "@/features/admin/components/AdminVehicleCatalogPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminCategoriesPage() {
  return (
    <AdminShell
      activePath="/admin/categories"
      description="أضف أقساماً جديدة بسلوك برمجي ذكي (وظائف، عقارات، سلع، خدمات…)، مع منشئ النماذج الديناميكية وكتالوج السيارات."
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
