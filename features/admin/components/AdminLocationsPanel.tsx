"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import type { LocationRecord } from "@/types/domain/location";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";

type Draft = {
  name: string;
  emirate: string;
  sortOrder: string;
};

function nextOrderFor(list: LocationRecord[]) {
  if (list.length === 0) return 1;
  return Math.max(...list.map((item) => item.sortOrder)) + 1;
}

function emptyDraft(list: LocationRecord[]): Draft {
  return { name: "", emirate: "", sortOrder: String(nextOrderFor(list)) };
}

export function AdminLocationsPanel() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [draft, setDraft] = useState<Draft>({
    name: "",
    emirate: "",
    sortOrder: "1",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...locations].sort((a, b) => a.sortOrder - b.sortOrder),
    [locations],
  );

  const nextSortOrder = nextOrderFor(locations);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") {
      setLoading(false);
      return;
    }
    adminFetch("/api/admin/locations")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.locations ?? []) as LocationRecord[];
        setLocations(list);
        setDraft((prev) =>
          prev.name || prev.emirate ? prev : emptyDraft(list),
        );
      })
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft(locations));
    setError(null);
    setSuccess(null);
  }

  function startEdit(location: LocationRecord) {
    setEditingId(location.id);
    setDraft({
      name: location.name,
      emirate: location.emirate ?? "",
      sortOrder: String(location.sortOrder),
    });
    setError(null);
    setSuccess(null);
    if (typeof document !== "undefined") {
      document
        .getElementById("admin-location-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function toggleEnabled(location: LocationRecord) {
    const session = getSessionUser();
    if (!session) return;
    setBusyId(location.id);
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !location.enabled }),
      });
      const data = await response.json();
      if (!response.ok || !data.location) {
        setError("تعذّر تحديث حالة الموقع.");
        return;
      }
      setLocations((prev) =>
        prev.map((item) => (item.id === location.id ? data.location : item)),
      );
      setSuccess(
        data.location.enabled
          ? `تم تفعيل «${data.location.name}».`
          : `تم تعطيل «${data.location.name}».`,
      );
    } finally {
      setBusyId(null);
    }
  }

  async function moveLocation(location: LocationRecord, direction: -1 | 1) {
    const index = sorted.findIndex((item) => item.id === location.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    setBusyId(location.id);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        adminFetch(`/api/admin/locations/${location.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
        }),
        adminFetch(`/api/admin/locations/${swapWith.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: location.sortOrder }),
        }),
      ]);
      const dataA = await resA.json();
      const dataB = await resB.json();
      if (!resA.ok || !resB.ok) {
        setError("تعذّر تغيير ترتيب العرض.");
        return;
      }
      setLocations((prev) =>
        prev.map((item) => {
          if (item.id === location.id && dataA.location) return dataA.location;
          if (item.id === swapWith.id && dataB.location) return dataB.location;
          return item;
        }),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(location: LocationRecord) {
    const session = getSessionUser();
    if (!session) return;
    const ok = window.confirm(
      `حذف الموقع «${location.name}» نهائياً؟ لن يظهر في البحث أو إضافة الإعلان.`,
    );
    if (!ok) return;
    setBusyId(location.id);
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/locations/${location.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("تعذّر حذف الموقع.");
        return;
      }
      const nextList = locations.filter((item) => item.id !== location.id);
      setLocations(nextList);
      if (editingId === location.id) {
        setEditingId(null);
        setDraft(emptyDraft(nextList));
      }
      setSuccess(`تم حذف «${location.name}».`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSave() {
    const session = getSessionUser();
    const trimmedName = draft.name.trim();
    if (!session || !trimmedName) {
      setError("اسم المدينة مطلوب.");
      return;
    }

    const orderRaw = draft.sortOrder.trim();
    const parsedOrder = orderRaw ? Number(orderRaw) : NaN;
    if (orderRaw && (!Number.isFinite(parsedOrder) || parsedOrder < 0)) {
      setError("ترتيب العرض يجب أن يكون رقماً صالحاً.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingId) {
        const response = await adminFetch(
          `/api/admin/locations/${editingId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: trimmedName,
              emirate: draft.emirate.trim(),
              ...(Number.isFinite(parsedOrder)
                ? { sortOrder: parsedOrder }
                : {}),
            }),
          },
        );
        const data = await response.json();
        if (!response.ok || !data.location) {
          setError("تعذّر حفظ تعديلات الموقع.");
          return;
        }
        const nextList = locations
          .map((item) => (item.id === editingId ? data.location : item))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setLocations(nextList);
        setSuccess(`تم تحديث «${data.location.name}».`);
        setEditingId(null);
        setDraft(emptyDraft(nextList));
        return;
      }

      const response = await adminFetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          emirate: draft.emirate.trim() || undefined,
          sortOrder: Number.isFinite(parsedOrder)
            ? parsedOrder
            : nextSortOrder,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.location) {
        setError("تعذّر إضافة الموقع.");
        return;
      }
      const nextList = [...locations, data.location].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      setLocations(nextList);
      setSuccess(`تمت إضافة «${data.location.name}».`);
      setDraft(emptyDraft(nextList));
    } finally {
      setSaving(false);
    }
  }

  function onFormKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSave();
    }
  }

  const isEditing = Boolean(editingId);

  return (
    <div className="grid gap-4">
      <Card className="p-5" id="admin-location-form" variant="flat">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon name={isEditing ? "edit" : "plus"} size={16} />
              {isEditing ? "تعديل موقع / مدينة" : "إضافة موقع / مدينة"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {isEditing
                ? "عدّل الاسم أو الإمارة أو الترتيب ثم احفظ — التغيير يظهر فوراً في البحث والهيرو وإضافة الإعلان."
                : "أدخل اسم المدينة واحفظ. المواقع المفعّلة تظهر فوراً في البحث، الهيرو، إضافة الإعلان، والملف الشخصي."}
            </p>
          </div>
          {isEditing ? (
            <Button onClick={startCreate} size="sm" variant="ghost">
              إلغاء التعديل · إضافة جديد
            </Button>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {success ? (
          <p className="mt-3 text-sm text-emerald-700">{success}</p>
        ) : null}

        <div
          className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr_0.7fr_auto]"
          onKeyDown={onFormKeyDown}
        >
          <Input
            autoFocus={!isEditing}
            label="اسم المدينة"
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="مثال: دبي"
            value={draft.name}
          />
          <Input
            label="الإمارة (اختياري)"
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, emirate: event.target.value }))
            }
            placeholder="مثال: دبي"
            value={draft.emirate}
          />
          <Input
            label="ترتيب العرض"
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, sortOrder: event.target.value }))
            }
            placeholder={String(nextSortOrder)}
            type="number"
            value={draft.sortOrder}
          />
          <div className="flex items-end gap-2">
            <Button
              disabled={!draft.name.trim()}
              loading={saving}
              onClick={() => void handleSave()}
              size="sm"
              variant="primary"
            >
              {isEditing ? "حفظ التعديل" : "إضافة الموقع"}
            </Button>
            {isEditing ? (
              <Button
                disabled={saving}
                onClick={startCreate}
                size="sm"
                variant="ghost"
              >
                إلغاء
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">جاري تحميل المواقع…</p>
        </Card>
      ) : sorted.length === 0 ? (
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm text-muted">
            لا توجد مواقع بعد. أضف أول مدينة من النموذج أعلاه.
          </p>
        </Card>
      ) : (
        <div className="admin-boxes__grid">
          {sorted.map((location, index) => {
            const isRowEditing = editingId === location.id;
            return (
              <Card
                key={location.id}
                className={`p-5 ${isRowEditing ? "ring-2 ring-primary/40" : ""}`}
                variant="flat"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
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
                      <span className="text-xs text-muted">
                        ترتيب {location.sortOrder}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={index === 0 || busyId === location.id}
                      onClick={() => void moveLocation(location, -1)}
                      size="sm"
                      title="تحريك لأعلى"
                      variant="ghost"
                    >
                      ↑
                    </Button>
                    <Button
                      disabled={
                        index === sorted.length - 1 || busyId === location.id
                      }
                      onClick={() => void moveLocation(location, 1)}
                      size="sm"
                      title="تحريك لأسفل"
                      variant="ghost"
                    >
                      ↓
                    </Button>
                    <Button
                      onClick={() => startEdit(location)}
                      size="sm"
                      variant={isRowEditing ? "secondary" : "ghost"}
                    >
                      تعديل
                    </Button>
                    <Button
                      loading={busyId === location.id}
                      onClick={() => void toggleEnabled(location)}
                      size="sm"
                      variant={location.enabled ? "ghost" : "secondary"}
                    >
                      {location.enabled ? "تعطيل" : "تفعيل"}
                    </Button>
                    <Button
                      loading={busyId === location.id}
                      onClick={() => void handleDelete(location)}
                      size="sm"
                      variant="ghost"
                    >
                      حذف
                    </Button>
                  </div>
                </div>
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
