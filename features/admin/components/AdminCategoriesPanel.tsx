"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminCategoryRecord, CategoryIconName } from "@/types";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { listingCountLabel } from "@/shared/i18n/count-labels";
import { useLocale } from "@/shared/i18n/useLocale";
import {
  CATEGORY_FEATURE_PROFILES,
  CATEGORY_ICON_OPTIONS,
  getCategoryFeatureProfileMeta,
  slugifyCategoryName,
  type CategoryFeatureProfile,
} from "@/shared/constants/category-feature-profiles";

const PROFILE_LABELS = Object.fromEntries(
  CATEGORY_FEATURE_PROFILES.map((profile) => [profile.id, profile.label]),
) as Record<CategoryFeatureProfile, string>;

export function AdminCategoriesPanel() {
  const locale = useLocale();
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [featureProfile, setFeatureProfile] =
    useState<CategoryFeatureProfile>("general");
  const [icon, setIcon] = useState<CategoryIconName>("sofa");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState<CategoryIconName>("sofa");
  const [editProfile, setEditProfile] = useState<CategoryFeatureProfile>("general");
  const [reseedForm, setReseedForm] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedProfile = useMemo(
    () => getCategoryFeatureProfileMeta(featureProfile),
    [featureProfile],
  );

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const effectiveSlug = slugTouched ? slug : slugifyCategoryName(name);

  async function toggleEnabled(category: AdminCategoryRecord) {
    const session = getSessionUser();
    if (!session) return;
    setBusyId(category.id);
    try {
      const response = await adminFetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled: !category.enabled }),
        },
      );
      const data = await response.json();
      if (response.ok && data.category) {
        setCategories((prev) =>
          prev.map((item) => (item.id === category.id ? data.category : item)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function patchSortOrder(category: AdminCategoryRecord, nextOrder: number) {
    const session = getSessionUser();
    if (!session || !Number.isFinite(nextOrder)) return;
    setBusyId(category.id);
    try {
      const response = await adminFetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: nextOrder }),
        },
      );
      const data = await response.json();
      if (response.ok && data.category) {
        setCategories((prev) =>
          prev
            .map((item) => (item.id === category.id ? data.category : item))
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }


  function startEdit(category: AdminCategoryRecord) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon);
    setEditProfile(category.featureProfile ?? "general");
    setReseedForm(true);
    setError(null);
    setSuccess(null);
  }

  async function saveEdit(category: AdminCategoryRecord) {
    const session = getSessionUser();
    if (!session || !editName.trim()) return;
    setBusyId(category.id);
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          icon: editIcon,
          featureProfile: editProfile,
          reseedForm:
            reseedForm &&
            editProfile !== (category.featureProfile ?? "general"),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.category) {
        setError("تعذر حفظ تعديلات الفئة.");
        return;
      }
      setCategories((prev) =>
        prev.map((item) => (item.id === category.id ? data.category : item)),
      );
      setEditingId(null);
      setSuccess(`تم تحديث «${data.category.name}».`);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCategory(category: AdminCategoryRecord) {
    const session = getSessionUser();
    if (!session) return;
    const ok = window.confirm(
      `حذف الفئة «${category.name}» نهائياً؟ لن تظهر في السوق ولن يمكن التراجع.`,
    );
    if (!ok) return;
    setBusyId(category.id);
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("تعذر حذف الفئة.");
        return;
      }
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      if (editingId === category.id) setEditingId(null);
      setSuccess(`تم حذف «${category.name}».`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate() {
    const session = getSessionUser();
    if (!session || !name.trim()) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await adminFetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: effectiveSlug.trim(),
          icon,
          featureProfile,
          seedForm: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "SLUG_TAKEN") {
          setError("المعرّف مستخدم مسبقاً — غيّر الاسم أو الـ slug.");
        } else if (data.error === "INVALID_SLUG") {
          setError("معرّف غير صالح — استخدم حروفاً إنجليزية وأرقاماً.");
        } else {
          setError("تعذر حفظ الفئة. حاول مرة أخرى.");
        }
        return;
      }
      if (data.category) {
        setCategories((prev) => [data.category, ...prev]);
        setName("");
        setSlug("");
        setSlugTouched(false);
        setFeatureProfile("general");
        setSuccess(
          `تم إنشاء «${data.category.name}» مع نموذج الإعلان وسلوك ${PROFILE_LABELS[data.category.featureProfile as CategoryFeatureProfile] ?? "عام"}.`,
        );
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5" variant="flat">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon name="plus" size={16} />
          إضافة فئة ذكية
        </h2>
        <p className="mt-2 text-sm text-muted">
          اختر نوع السلوك البرمجي للفئة — يتحدد زر الإعلان (تقديم وظيفة، شراء الآن، معاينة…)
          ويُزرع نموذج إضافة الإعلان تلقائياً.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="اسم الفئة"
            onChange={(event) => setName(event.target.value)}
            placeholder="مثال: مستلزمات مكتبية"
            value={name}
          />
          <Input
            label="المعرّف (slug)"
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="office-supplies"
            value={effectiveSlug}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Select
            label="سلوك السوق / الميزة"
            onChange={(event) => {
              const next = event.target.value as CategoryFeatureProfile;
              setFeatureProfile(next);
              setIcon(getCategoryFeatureProfileMeta(next).defaultIcon);
            }}
            options={CATEGORY_FEATURE_PROFILES.map((profile) => ({
              label: profile.label,
              value: profile.id,
            }))}
            value={featureProfile}
          />
          <Select
            label="الأيقونة"
            onChange={(event) => setIcon(event.target.value as CategoryIconName)}
            options={CATEGORY_ICON_OPTIONS}
            value={icon}
          />
        </div>

        <div className="mt-4 rounded-[var(--radius-xl)] border border-border/80 bg-[#f8f6f1] p-4">
          <p className="text-sm font-bold text-ink">{selectedProfile.label}</p>
          <p className="mt-1 text-sm text-muted">{selectedProfile.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedProfile.capabilities.map((cap) => (
              <Badge key={cap} variant="muted">
                {cap}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={!name.trim()}
            loading={creating}
            onClick={() => void handleCreate()}
            size="sm"
            variant="primary"
          >
            حفظ الفئة وتهيئة النموذج
          </Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        </div>
      </Card>

      {categories.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">لا توجد فئات.</p>
        </Card>
      ) : (
        categories.map((category) => {
          const profile = category.featureProfile ?? "general";
          const isEditing = editingId === category.id;
          return (
            <Card key={category.id} className="p-5" variant="flat">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="اسم الفئة"
                        onChange={(event) => setEditName(event.target.value)}
                        value={editName}
                      />
                      <Select
                        label="الأيقونة"
                        onChange={(event) =>
                          setEditIcon(event.target.value as CategoryIconName)
                        }
                        options={CATEGORY_ICON_OPTIONS}
                        value={editIcon}
                      />
                      <Select
                        label="سلوك السوق"
                        onChange={(event) =>
                          setEditProfile(event.target.value as CategoryFeatureProfile)
                        }
                        options={CATEGORY_FEATURE_PROFILES.map((item) => ({
                          label: item.label,
                          value: item.id,
                        }))}
                        value={editProfile}
                      />
                      <label className="flex items-end gap-2 pb-2 text-xs text-ink">
                        <input
                          checked={reseedForm}
                          onChange={(event) => setReseedForm(event.target.checked)}
                          type="checkbox"
                        />
                        إعادة تهيئة نموذج الإعلان عند تغيير السلوك
                      </label>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-ink">{category.name}</p>
                      <p className="mt-1 text-xs text-muted">{category.slug}</p>
                    </>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={category.enabled ? "verified" : "rejected"}>
                      {category.enabled ? "مفعّلة" : "معطّلة"}
                    </Badge>
                    <Badge variant="premium">
                      {PROFILE_LABELS[isEditing ? editProfile : profile] ?? profile}
                    </Badge>
                    <Badge variant="muted">
                      {listingCountLabel(category.listingCount, locale)}
                    </Badge>
                    <label className="flex items-center gap-1 text-xs text-muted">
                      ترتيب
                      <input
                        className="w-16 rounded border border-border bg-surface px-2 py-1 text-ink"
                        defaultValue={category.sortOrder ?? 0}
                        key={`${category.id}-${category.sortOrder}`}
                        onBlur={(event) => {
                          const next = Number(event.target.value);
                          if (next !== category.sortOrder) {
                            void patchSortOrder(category, next);
                          }
                        }}
                        type="number"
                      />
                    </label>
                  </div>
                  {!isEditing && category.subcategories.length > 0 ? (
                    <p className="mt-2 text-xs text-muted">
                      {category.subcategories.slice(0, 4).join(" · ")}
                      {category.subcategories.length > 4 ? "…" : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        loading={busyId === category.id}
                        onClick={() => void saveEdit(category)}
                        size="sm"
                        variant="primary"
                      >
                        حفظ
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        size="sm"
                        variant="ghost"
                      >
                        إلغاء
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => startEdit(category)}
                        size="sm"
                        variant="secondary"
                      >
                        تعديل
                      </Button>
                      <Button
                        loading={busyId === category.id}
                        onClick={() => void toggleEnabled(category)}
                        size="sm"
                        variant={category.enabled ? "ghost" : "secondary"}
                      >
                        {category.enabled ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Button
                        loading={busyId === category.id}
                        onClick={() => void deleteCategory(category)}
                        size="sm"
                        variant="ghost"
                      >
                        حذف
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })
      )}

      <Link className="text-sm font-semibold text-primary" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}
