"use client";

import { useState } from "react";
import { AdminCategoriesPanel } from "@/features/admin/components/AdminCategoriesPanel";
import { AdminCategoryFormsPanel } from "@/features/admin/components/AdminCategoryFormsPanel";
import { AdminVehicleCatalogPanel } from "@/features/admin/components/AdminVehicleCatalogPanel";

type CategoriesTab = "categories" | "forms" | "vehicles";

const TABS: { id: CategoriesTab; label: string }[] = [
  { id: "categories", label: "التصنيفات" },
  { id: "forms", label: "نماذج الحقول" },
  { id: "vehicles", label: "كتالوج السيارات" },
];

export function AdminCategoriesWorkspace() {
  const [tab, setTab] = useState<CategoriesTab>("categories");

  return (
    <div className="grid gap-4">
      <div className="admin-ops__section-tabs" role="tablist" aria-label="أقسام التصنيفات">
        {TABS.map((item) => (
          <button
            key={item.id}
            aria-selected={tab === item.id}
            className={`admin-ops__section-tab${
              tab === item.id ? " admin-ops__section-tab--active" : ""
            }`}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "categories" ? <AdminCategoriesPanel /> : null}
      {tab === "forms" ? <AdminCategoryFormsPanel /> : null}
      {tab === "vehicles" ? <AdminVehicleCatalogPanel /> : null}
    </div>
  );
}
