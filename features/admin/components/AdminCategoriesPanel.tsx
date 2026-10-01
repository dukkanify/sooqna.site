"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";
import type { AdminCategoryRecord, CategoryIconName } from "@/types";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { CategoryIcon } from "@/shared/ui/CategoryIcon";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
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
  const [showCreate, setShowCreate] = useState(false);
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
  const [editProfile, setEditProfile] =
    useState<CategoryFeatureProfile>("general");
  const [reseedForm, setReseedForm] = useState(true);
  const [editSubs, setEditSubs] = useState<string[]>([]);
  const [editSubDraft, setEditSubDraft] = useState("");
  const [createSubsText, setCreateSubsText] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedProfile = useMemo(
    () => getCategoryFeatureProfileMeta(featureProfile),
    [featureProfile],
  );

  const sorted = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    [categories],
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
          headers: { "Content-Type": "application/json" },
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

  async function moveCategory(category: AdminCategoryRecord, direction: -1 | 1) {
    const index = sorted.findIndex((item) => item.id === category.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    const aOrder = category.sortOrder ?? index;
    const bOrder = swapWith.sortOrder ?? index + direction;
    setBusyId(category.id);
    try {
      const [resA, resB] = await Promise.all([
        adminFetch(`/api/admin/categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: bOrder }),
        }),
        adminFetch(`/api/admin/categories/${swapWith.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: aOrder }),
        }),
      ]);
      const dataA = await resA.json();
      const dataB = await resB.json();
      setCategories((prev) =>
        prev.map((item) => {
          if (item.id === category.id && dataA.category) return dataA.category;
          if (item.id === swapWith.id && dataB.category) return dataB.category;
          return item;
        }),
      );
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
    setEditSubs([...category.subcategories]);
    setEditSubDraft("");
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function moveEditSub(index: number, direction: -1 | 1) {
    setEditSubs((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });
  }

  function addEditSub() {
    const value = editSubDraft.trim();
    if (!value) return;
    setEditSubs((current) =>
      current.includes(value) ? current : [...current, value],
    );
    setEditSubDraft("");
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
          subcategories: editSubs.map((item) => item.trim()).filter(Boolean),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: effectiveSlug.trim(),
          icon,
          featureProfile,
          seedForm: true,
          subcategories: createSubsText
            .split(/[\n,،]+/)
            .map((item) => item.trim())
            .filter(Boolean),
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
        setCreateSubsText("");
        setFeatureProfile("general");
        setShowCreate(false);
        setSuccess(
          `تم إنشاء «${data.category.name}» مع نموذج الإعلان وسلوك ${PROFILE_LABELS[data.category.featureProfile as CategoryFeatureProfile] ?? "عام"}.`,
        );
      }
    } finally {
      setCreating(false);
    }
  }

  const editPanelProps = {
    editName,
    setEditName,
    editIcon,
    setEditIcon,
    editProfile,
    setEditProfile,
    reseedForm,
    setReseedForm,
    editSubs,
    setEditSubs,
    editSubDraft,
    setEditSubDraft,
    moveEditSub,
    addEditSub,
    busyId,
    cancelEdit,
    saveEdit,
  };

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">{sorted.length} تصنيف</p>
        <Button
          onClick={() => setShowCreate((prev) => !prev)}
          size="sm"
          type="button"
          variant={showCreate ? "ghost" : "secondary"}
        >
          {showCreate ? "إخفاء النموذج" : "إضافة فئة"}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      {showCreate ? (
        <Card className="p-5" variant="flat">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Icon name="plus" size={16} />
            إضافة فئة
          </h2>
          <p className="mt-2 text-sm text-muted">
            اختر نوع القسم — يتحدد سلوك الإعلان ويُجهَّز النموذج تلقائياً.
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
              label="نوع القسم"
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
              onChange={(event) =>
                setIcon(event.target.value as CategoryIconName)
              }
              options={CATEGORY_ICON_OPTIONS}
              value={icon}
            />
          </div>

          <div className="mt-4 grid gap-1.5">
            <Textarea
              label="تصنيفات فرعية (اختياري)"
              onChange={(event) => setCreateSubsText(event.target.value)}
              placeholder={
                "سطر أو فاصلة لكل تصنيف\nمثال: فاخرة، اقتصادية، دفع رباعي"
              }
              rows={3}
              value={createSubsText}
            />
            <p className="text-xs text-muted">
              تظهر في خطوة «اختر القسم» عند إضافة إعلان — قائمة «القسم
              الفرعي» (وليست حقول النموذج مثل نوع الأثاث).
            </p>
          </div>

          <div className="mt-4 rounded-[var(--radius-xl)] border border-border/80 bg-[#f8f6f1] p-4">
            <p className="text-sm font-bold text-ink">{selectedProfile.label}</p>
            <p className="mt-1 text-sm text-muted">
              {selectedProfile.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedProfile.capabilities.map((cap) => (
                <Badge key={cap} variant="muted">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Button
              disabled={!name.trim()}
              loading={creating}
              onClick={() => void handleCreate()}
              size="sm"
              variant="primary"
            >
              حفظ الفئة وتهيئة النموذج
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الفئة</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>إعلانات</th>
                <th>الترتيب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={6}>
                    لا توجد فئات.
                  </td>
                </tr>
              ) : (
                sorted.map((category, index) => {
                  const profile = category.featureProfile ?? "general";
                  const isEditing = editingId === category.id;
                  return (
                    <Fragment key={category.id}>
                      <tr>
                        <td className="admin-desk-cell-wrap">
                          <div className="flex items-center gap-2">
                            <span aria-hidden>
                              <CategoryIcon
                                category={{ icon: category.icon }}
                                size={22}
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="admin-desk-cell-title font-bold text-ink">
                                {category.name}
                              </p>
                              <p className="text-xs text-muted" dir="ltr">
                                {category.slug}
                              </p>
                              {category.subcategories.length > 0 ? (
                                <p className="mt-0.5 text-xs text-muted">
                                  {category.subcategories.slice(0, 3).join(" · ")}
                                  {category.subcategories.length > 3 ? "…" : ""}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="premium">
                            {PROFILE_LABELS[profile] ?? profile}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            variant={category.enabled ? "verified" : "rejected"}
                          >
                            {category.enabled ? "مفعّلة" : "معطّلة"}
                          </Badge>
                        </td>
                        <td>{listingCountLabel(category.listingCount, locale)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button
                              aria-label="تقديم في الترتيب"
                              disabled={index === 0 || busyId === category.id}
                              onClick={() => void moveCategory(category, -1)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              ‹
                            </Button>
                            <span className="text-xs font-semibold text-muted">
                              {index + 1}
                            </span>
                            <Button
                              aria-label="تأخير في الترتيب"
                              disabled={
                                index === sorted.length - 1 ||
                                busyId === category.id
                              }
                              onClick={() => void moveCategory(category, 1)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              ›
                            </Button>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              aria-expanded={isEditing}
                              onClick={() =>
                                isEditing
                                  ? cancelEdit()
                                  : startEdit(category)
                              }
                              size="sm"
                              type="button"
                              variant={isEditing ? "ghost" : "secondary"}
                            >
                              {isEditing ? "إخفاء" : "تعديل"}
                            </Button>
                            <Button
                              loading={busyId === category.id}
                              onClick={() => void toggleEnabled(category)}
                              size="sm"
                              type="button"
                              variant={category.enabled ? "ghost" : "secondary"}
                            >
                              {category.enabled ? "تعطيل" : "تفعيل"}
                            </Button>
                            <Button
                              loading={busyId === category.id}
                              onClick={() => void deleteCategory(category)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isEditing ? (
                        <tr>
                          <td className="admin-desk-cell-wrap" colSpan={6}>
                            <CategoryEditPanel
                              category={category}
                              {...editPanelProps}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <ul className="admin-desk-mobile-list">
          {sorted.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لا توجد فئات.</p>
            </li>
          ) : (
            sorted.map((category, index) => {
              const profile = category.featureProfile ?? "general";
              const isEditing = editingId === category.id;
              return (
                <li key={category.id} className="admin-desk-mobile-card">
                  <div className="admin-desk-mobile-card__head">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span aria-hidden>
                        <CategoryIcon
                          category={{ icon: category.icon }}
                          size={22}
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">
                          {category.name}
                        </p>
                        <p className="text-xs text-muted" dir="ltr">
                          {category.slug}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={category.enabled ? "verified" : "rejected"}
                    >
                      {category.enabled ? "مفعّلة" : "معطّلة"}
                    </Badge>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>{PROFILE_LABELS[profile] ?? profile}</span>
                    <span>
                      {listingCountLabel(category.listingCount, locale)}
                    </span>
                    <span>ترتيب {index + 1}</span>
                  </div>
                  {category.subcategories.length > 0 ? (
                    <p className="text-xs text-muted">
                      {category.subcategories.slice(0, 3).join(" · ")}
                      {category.subcategories.length > 3 ? "…" : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">بدون فرعيات</p>
                  )}
                  <div className="admin-desk-mobile-card__actions">
                    <Button
                      aria-expanded={isEditing}
                      onClick={() =>
                        isEditing ? cancelEdit() : startEdit(category)
                      }
                      size="sm"
                      type="button"
                      variant={isEditing ? "ghost" : "secondary"}
                    >
                      {isEditing ? "إخفاء" : "تعديل"}
                    </Button>
                    <Button
                      disabled={index === 0 || busyId === category.id}
                      onClick={() => void moveCategory(category, -1)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      ‹
                    </Button>
                    <Button
                      disabled={
                        index === sorted.length - 1 || busyId === category.id
                      }
                      onClick={() => void moveCategory(category, 1)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      ›
                    </Button>
                    <Button
                      loading={busyId === category.id}
                      onClick={() => void toggleEnabled(category)}
                      size="sm"
                      type="button"
                      variant={category.enabled ? "ghost" : "secondary"}
                    >
                      {category.enabled ? "تعطيل" : "تفعيل"}
                    </Button>
                    <Button
                      loading={busyId === category.id}
                      onClick={() => void deleteCategory(category)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      حذف
                    </Button>
                  </div>
                  {isEditing ? (
                    <CategoryEditPanel
                      category={category}
                      {...editPanelProps}
                    />
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </Card>

      <Link className="admin-ops__text-link" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}

type CategoryEditPanelProps = {
  category: AdminCategoryRecord;
  editName: string;
  setEditName: (value: string) => void;
  editIcon: CategoryIconName;
  setEditIcon: (value: CategoryIconName) => void;
  editProfile: CategoryFeatureProfile;
  setEditProfile: (value: CategoryFeatureProfile) => void;
  reseedForm: boolean;
  setReseedForm: (value: boolean) => void;
  editSubs: string[];
  setEditSubs: Dispatch<SetStateAction<string[]>>;
  editSubDraft: string;
  setEditSubDraft: (value: string) => void;
  moveEditSub: (index: number, direction: -1 | 1) => void;
  addEditSub: () => void;
  busyId: string | null;
  cancelEdit: () => void;
  saveEdit: (category: AdminCategoryRecord) => Promise<void>;
};

function CategoryEditPanel({
  category,
  editName,
  setEditName,
  editIcon,
  setEditIcon,
  editProfile,
  setEditProfile,
  reseedForm,
  setReseedForm,
  editSubs,
  setEditSubs,
  editSubDraft,
  setEditSubDraft,
  moveEditSub,
  addEditSub,
  busyId,
  cancelEdit,
  saveEdit,
}: CategoryEditPanelProps) {
  return (
    <div className="grid gap-3 py-2">
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
          label="نوع القسم"
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
          إعادة تهيئة النموذج عند تغيير السلوك
        </label>
        <div className="sm:col-span-2 grid gap-2 rounded-[var(--radius-lg)] border border-border bg-surface/60 p-3">
          <p className="text-sm font-semibold text-ink">التصنيفات الفرعية</p>
          <p className="text-xs text-muted">
            تظهر في خطوة «اختر القسم» عند إضافة إعلان — قائمة «القسم الفرعي»
            (وليست حقول النموذج مثل نوع الأثاث).
          </p>
          {editSubs.length === 0 ? (
            <p className="text-xs text-muted">لا توجد تصنيفات فرعية.</p>
          ) : (
            <ul className="grid gap-2">
              {editSubs.map((sub, subIndex) => (
                <li
                  className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center"
                  key={`${sub}-${subIndex}`}
                >
                  <Input
                    aria-label={`تصنيف فرعي ${subIndex + 1}`}
                    onChange={(event) => {
                      const value = event.target.value;
                      setEditSubs((current) =>
                        current.map((item, rowIndex) =>
                          rowIndex === subIndex ? value : item,
                        ),
                      );
                    }}
                    value={sub}
                  />
                  <div className="flex flex-wrap gap-1">
                    <Button
                      disabled={subIndex === 0}
                      onClick={() => moveEditSub(subIndex, -1)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      يمين
                    </Button>
                    <Button
                      disabled={subIndex === editSubs.length - 1}
                      onClick={() => moveEditSub(subIndex, 1)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      يسار
                    </Button>
                    <Button
                      onClick={() =>
                        setEditSubs((current) =>
                          current.filter(
                            (_, rowIndex) => rowIndex !== subIndex,
                          ),
                        )
                      }
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      حذف
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="إضافة تصنيف فرعي"
              onChange={(event) => setEditSubDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addEditSub();
                }
              }}
              placeholder="مثال: سيارات فاخرة"
              value={editSubDraft}
            />
            <Button
              onClick={addEditSub}
              size="sm"
              type="button"
              variant="secondary"
            >
              إضافة
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          loading={busyId === category.id}
          onClick={() => void saveEdit(category)}
          size="sm"
          type="button"
          variant="primary"
        >
          حفظ
        </Button>
        <Button onClick={cancelEdit} size="sm" type="button" variant="ghost">
          إلغاء
        </Button>
      </div>
    </div>
  );
}
