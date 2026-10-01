"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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

      <Card className="p-4" variant="flat">
        <div className="flex flex-wrap items-end gap-3">
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
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">جاري تحميل المواقع...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">
            {locations.length === 0
              ? "لا توجد مواقع بعد — أضف أول مدينة من النموذج أعلاه."
              : "لا توجد نتائج مطابقة للبحث."}
          </p>
        </Card>
      ) : (
        <div className="admin-locations__grid admin-boxes__grid">
          {filtered.map((location) => {
            const isEditing = editingId === location.id;
            return (
              <Card
                key={location.id}
                className={`admin-locations__card p-5${
                  isEditing ? " admin-locations__card--editing" : ""
                }`}
                variant="flat"
              >
                {isEditing ? (
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-ink">
                        تعديل الموقع
                      </h3>
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
                    {editError ? (
                      <FormMessage variant="error">{editError}</FormMessage>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        loading={busyId === location.id}
                        onClick={() => void saveEdit(location)}
                        size="sm"
                        type="button"
                        variant="primary"
                      >
                        حفظ التعديل
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{location.name}</p>
                        {location.emirate ? (
                          <p className="mt-1 text-xs text-muted">
                            {location.emirate}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted">بدون إمارة</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={location.enabled ? "verified" : "rejected"}
                          >
                            {location.enabled ? "مفعّل" : "معطّل"}
                          </Badge>
                          <span className="text-xs font-semibold text-muted">
                            ترتيب: {location.sortOrder}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="admin-locations__actions flex flex-wrap gap-2">
                      <Button
                        onClick={() => startEdit(location)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        تعديل
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
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Link className="text-sm font-semibold text-primary" href="/admin">
        ← العودة للإدارة
      </Link>
    </div>
  );
}
