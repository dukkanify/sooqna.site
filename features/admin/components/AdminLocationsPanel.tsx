"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import Link from "next/link";
import type { LocationRecord } from "@/types/domain/location";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";

type EditDraft = {
  name: string;
  emirate: string;
  sortOrder: string;
};

function emptyDraft(location?: LocationRecord): EditDraft {
  return {
    name: location?.name ?? "",
    emirate: location?.emirate ?? "",
    sortOrder: location ? String(location.sortOrder) : "",
  };
}

export function AdminLocationsPanel() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [emirate, setEmirate] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [createError, setCreateError] = useState("");
  const [createOk, setCreateOk] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>(emptyDraft());
  const [editError, setEditError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    adminFetch("/api/admin/locations")
      .then((res) => res.json())
      .then((data) => setLocations(data.locations ?? []))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  const nextSortSuggestion = useMemo(() => {
    if (locations.length === 0) return "1";
    return String(Math.max(...locations.map((row) => row.sortOrder)) + 1);
  }, [locations]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(q) ||
        (location.emirate?.toLowerCase().includes(q) ?? false),
    );
  }, [locations, searchQuery]);

  function startEdit(location: LocationRecord) {
    setEditingId(location.id);
    setEditDraft(emptyDraft(location));
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(emptyDraft());
    setEditError("");
  }

  async function saveEdit(location: LocationRecord) {
    const nextName = editDraft.name.trim();
    if (!nextName) {
      setEditError("اسم المدينة مطلوب.");
      return;
    }
    const nextOrder = Number(editDraft.sortOrder);
    if (!Number.isFinite(nextOrder) || nextOrder < 1) {
      setEditError("ترتيب العرض يجب أن يكون رقماً صحيحاً (1 فأعلى).");
      return;
    }

    setBusyId(location.id);
    setEditError("");
    try {
      const response = await adminFetch(`/api/admin/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          emirate: editDraft.emirate.trim() || "",
          sortOrder: nextOrder,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.location) {
        setEditError(
          response.status === 401 || response.status === 403
            ? "انتهت صلاحية الجلسة. حدّث الصفحة وسجّل الدخول مجدداً."
            : "تعذر حفظ التعديل. حاول مرة أخرى.",
        );
        return;
      }
      setLocations((prev) =>
        prev
          .map((item) => (item.id === location.id ? data.location : item))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      );
      cancelEdit();
    } catch {
      setEditError("تعذر الاتصال بالخادم.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleEnabled(location: LocationRecord) {
    setBusyId(location.id);
    try {
      const response = await adminFetch(`/api/admin/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !location.enabled }),
      });
      const data = await response.json();
      if (response.ok && data.location) {
        setLocations((prev) =>
          prev.map((item) => (item.id === location.id ? data.location : item)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(location: LocationRecord) {
    const ok = window.confirm(
      `حذف الموقع «${location.name}»؟ سيختفي من البحث ونماذج النشر.`,
    );
    if (!ok) return;
    setBusyId(location.id);
    try {
      const response = await adminFetch(`/api/admin/locations/${location.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setLocations((prev) => prev.filter((item) => item.id !== location.id));
        if (editingId === location.id) cancelEdit();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setCreateError("اكتب اسم المدينة.");
      return;
    }
    const orderValue = sortOrder.trim()
      ? Number(sortOrder)
      : Number(nextSortSuggestion);
    if (!Number.isFinite(orderValue) || orderValue < 1) {
      setCreateError("ترتيب العرض يجب أن يكون رقماً صحيحاً.");
      return;
    }

    setCreating(true);
    setCreateError("");
    setCreateOk("");
    try {
      const response = await adminFetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          emirate: emirate.trim() || undefined,
          sortOrder: orderValue,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.location) {
        setCreateError(
          response.status === 401 || response.status === 403
            ? "انتهت صلاحية الجلسة. حدّث الصفحة وسجّل الدخول مجدداً."
            : "تعذر حفظ الموقع. حاول مرة أخرى.",
        );
        return;
      }
      setLocations((prev) =>
        [...prev, data.location].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      setName("");
      setEmirate("");
      setSortOrder("");
      setCreateOk(`تمت إضافة «${data.location.name}» بنجاح.`);
    } catch {
      setCreateError("تعذر الاتصال بالخادم.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-desk admin-locations grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          المواقع والمدن — أضف أو عدّل الظهور في البحث والهيرو والإعلانات.
        </p>
      </div>

      <Card className="admin-locations__create p-5" variant="flat">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon name="plus" size={16} />
          إضافة موقع / مدينة
        </h2>
        <p className="mt-2 text-sm text-muted">
          المواقع المفعّلة تظهر فوراً في البحث، الهيرو، إضافة الإعلان، والملف
          الشخصي.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={handleCreate}>
          <div className="admin-locations__create-grid">
            <Input
              label="اسم المدينة"
              onChange={(event) => {
                setName(event.target.value);
                setCreateError("");
                setCreateOk("");
              }}
              placeholder="مثال: دبي"
              required
              value={name}
            />
            <Input
              label="الإمارة (اختياري)"
              onChange={(event) => setEmirate(event.target.value)}
              placeholder="مثال: دبي"
              value={emirate}
            />
            <Input
              hint={`اتركه فارغاً لاستخدام ${nextSortSuggestion}`}
              label="ترتيب العرض"
              onChange={(event) => setSortOrder(event.target.value)}
              placeholder={nextSortSuggestion}
              type="number"
              value={sortOrder}
            />
          </div>
          {createError ? (
            <FormMessage variant="error">{createError}</FormMessage>
          ) : null}
          {createOk ? (
            <FormMessage variant="success">{createOk}</FormMessage>
          ) : null}
          <div>
            <Button
              disabled={!name.trim()}
              loading={creating}
              size="sm"
              type="submit"
              variant="primary"
            >
              حفظ الموقع
            </Button>
          </div>
        </form>
      </Card>

      <Card className="admin-desk-filters p-4" variant="flat">
        <div className="admin-desk-filters__grid flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              label="بحث سريع"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ابحث باسم المدينة أو الإمارة..."
              value={searchQuery}
            />
          </div>
          <p className="pb-2 text-xs text-muted">
            {loading
              ? "جاري التحميل..."
              : `${filtered.length} من ${locations.length} موقع`}
          </p>
        </div>
      </Card>

      {loading ? (
        <Card className="admin-desk-table-card p-8 text-center" variant="flat">
          <p className="text-sm text-muted">جاري تحميل المواقع...</p>
        </Card>
      ) : (
        <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
          <div className="admin-desk-table-scroll">
            <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
              <thead>
                <tr>
                  <th>المدينة</th>
                  <th>الإمارة</th>
                  <th>الحالة</th>
                  <th>الترتيب</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="text-muted" colSpan={5}>
                      {locations.length === 0
                        ? "لا توجد مواقع بعد — أضف أول مدينة من النموذج أعلاه."
                        : "لا توجد نتائج مطابقة للبحث."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((location) => {
                    const isEditing = editingId === location.id;
                    return (
                      <Fragment key={location.id}>
                        <tr>
                          <td className="admin-desk-cell-wrap">
                            <p className="admin-desk-cell-title font-bold text-ink">
                              {location.name}
                            </p>
                          </td>
                          <td className="admin-desk-cell-wrap text-sm text-muted">
                            {location.emirate || "—"}
                          </td>
                          <td>
                            <Badge
                              variant={
                                location.enabled ? "verified" : "rejected"
                              }
                            >
                              {location.enabled ? "مفعّل" : "معطّل"}
                            </Badge>
                          </td>
                          <td>{location.sortOrder}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                aria-expanded={isEditing}
                                onClick={() =>
                                  isEditing
                                    ? cancelEdit()
                                    : startEdit(location)
                                }
                                size="sm"
                                type="button"
                                variant={isEditing ? "ghost" : "secondary"}
                              >
                                {isEditing ? "إخفاء" : "تعديل"}
                              </Button>
                              <Button
                                loading={busyId === location.id}
                                onClick={() => void toggleEnabled(location)}
                                size="sm"
                                type="button"
                                variant={
                                  location.enabled ? "ghost" : "secondary"
                                }
                              >
                                {location.enabled ? "تعطيل" : "تفعيل"}
                              </Button>
                              <Button
                                loading={busyId === location.id}
                                onClick={() => void handleDelete(location)}
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
                            <td className="admin-desk-cell-wrap" colSpan={5}>
                              <LocationEditPanel
                                busyId={busyId}
                                editDraft={editDraft}
                                editError={editError}
                                location={location}
                                onCancel={cancelEdit}
                                onSave={() => void saveEdit(location)}
                                setEditDraft={setEditDraft}
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
            {filtered.length === 0 ? (
              <li className="admin-desk-mobile-card">
                <p className="text-sm text-muted">
                  {locations.length === 0
                    ? "لا توجد مواقع بعد — أضف أول مدينة من النموذج أعلاه."
                    : "لا توجد نتائج مطابقة للبحث."}
                </p>
              </li>
            ) : (
              filtered.map((location) => {
                const isEditing = editingId === location.id;
                return (
                  <li key={location.id} className="admin-desk-mobile-card">
                    <div className="admin-desk-mobile-card__head">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">
                          {location.name}
                        </p>
                        <p className="text-xs text-muted">
                          {location.emirate || "بدون إمارة"}
                        </p>
                      </div>
                      <Badge
                        variant={location.enabled ? "verified" : "rejected"}
                      >
                        {location.enabled ? "مفعّل" : "معطّل"}
                      </Badge>
                    </div>
                    <div className="admin-desk-mobile-card__meta">
                      <span>ترتيب {location.sortOrder}</span>
                    </div>
                    <div className="admin-desk-mobile-card__actions">
                      <Button
                        aria-expanded={isEditing}
                        onClick={() =>
                          isEditing ? cancelEdit() : startEdit(location)
                        }
                        size="sm"
                        type="button"
                        variant={isEditing ? "ghost" : "secondary"}
                      >
                        {isEditing ? "إخفاء" : "تعديل"}
                      </Button>
                      <Button
                        loading={busyId === location.id}
                        onClick={() => void toggleEnabled(location)}
                        size="sm"
                        type="button"
                        variant={location.enabled ? "ghost" : "secondary"}
                      >
                        {location.enabled ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Button
                        loading={busyId === location.id}
                        onClick={() => void handleDelete(location)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        حذف
                      </Button>
                    </div>
                    {isEditing ? (
                      <LocationEditPanel
                        busyId={busyId}
                        editDraft={editDraft}
                        editError={editError}
                        location={location}
                        onCancel={cancelEdit}
                        onSave={() => void saveEdit(location)}
                        setEditDraft={setEditDraft}
                      />
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </Card>
      )}

      <Link className="admin-ops__text-link" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}

type LocationEditPanelProps = {
  location: LocationRecord;
  editDraft: EditDraft;
  setEditDraft: Dispatch<SetStateAction<EditDraft>>;
  editError: string;
  busyId: string | null;
  onSave: () => void;
  onCancel: () => void;
};

function LocationEditPanel({
  location,
  editDraft,
  setEditDraft,
  editError,
  busyId,
  onSave,
  onCancel,
}: LocationEditPanelProps) {
  return (
    <div className="grid gap-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">تعديل الموقع</h3>
        <Badge variant={location.enabled ? "verified" : "rejected"}>
          {location.enabled ? "مفعّل" : "معطّل"}
        </Badge>
      </div>
      <Input
        label="اسم المدينة"
        onChange={(event) =>
          setEditDraft((current) => ({
            ...current,
            name: event.target.value,
          }))
        }
        value={editDraft.name}
      />
      <Input
        label="الإمارة (اختياري)"
        onChange={(event) =>
          setEditDraft((current) => ({
            ...current,
            emirate: event.target.value,
          }))
        }
        value={editDraft.emirate}
      />
      <Input
        label="ترتيب العرض"
        onChange={(event) =>
          setEditDraft((current) => ({
            ...current,
            sortOrder: event.target.value,
          }))
        }
        type="number"
        value={editDraft.sortOrder}
      />
      {editError ? <FormMessage variant="error">{editError}</FormMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          loading={busyId === location.id}
          onClick={onSave}
          size="sm"
          type="button"
          variant="primary"
        >
          حفظ التعديل
        </Button>
        <Button onClick={onCancel} size="sm" type="button" variant="ghost">
          إلغاء
        </Button>
      </div>
    </div>
  );
}
