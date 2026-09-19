"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import { Fragment, useEffect, useState } from "react";
import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

type ModelRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  active: boolean;
  disabled: boolean;
  added?: boolean;
};

type MakeRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  status: string;
  disabled: boolean;
  modelCount: number;
  countryCode?: string | null;
  countryNameEn?: string | null;
  countryNameAr?: string | null;
  models?: ModelRow[];
};

type Stats = {
  makesTotal: number;
  makesActive: number;
  makesWithCountry?: number;
  modelsTotal: number;
  modelsAdded?: number;
};

type Suggestion = {
  id: string;
  categoryId: string;
  fieldKey: string;
  value: string;
  requestedByName?: string;
  createdAt: string;
};

export function AdminVehicleCatalogPanel() {
  const locale = useLocale();
  const [makes, setMakes] = useState<MakeRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedMakeId, setExpandedMakeId] = useState<string | null>(null);
  const [newModelEn, setNewModelEn] = useState("");
  const [newModelAr, setNewModelAr] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    void adminFetch("/api/admin/vehicle-catalog")
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.error) {
          setMessage(String(data.error));
          return;
        }
        setMakes(data.makes ?? []);
        setStats(data.stats ?? null);
      })
      .catch(() => {
        if (!cancelled) setMessage("تعذر تحميل كتالوج السيارات");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    void adminFetch("/api/admin/option-suggestions?status=pending")
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setSuggestions(
          items.filter(
            (item: Suggestion) =>
              item.categoryId === "cars" && item.fieldKey === "model",
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function toggleMake(make: MakeRow) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await adminFetch("/api/admin/vehicle-catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toggleMakeSlug: make.slug,
          enabled: make.disabled,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error ?? "تعذر تحديث الحالة");
        return;
      }
      setReloadToken((value) => value + 1);
      setMessage(
        make.disabled
          ? `تم تفعيل ${make.nameEn}`
          : `تم تعطيل ${make.nameEn} من النماذج العامة`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleModel(model: ModelRow) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await adminFetch("/api/admin/vehicle-catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toggleModelId: model.id,
          enabled: model.disabled,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error ?? "تعذر تحديث الموديل");
        return;
      }
      setReloadToken((value) => value + 1);
      setMessage(
        model.disabled
          ? `تم تفعيل ${model.nameEn}`
          : `تم تعطيل ${model.nameEn} من نماذج الإضافة/البحث`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function addModel(make: MakeRow) {
    const nameEn = newModelEn.trim();
    if (!nameEn) {
      setMessage("أدخل اسم الموديل بالإنجليزية");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await adminFetch("/api/admin/vehicle-catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addModel: {
            makeSlug: make.slug,
            nameEn,
            nameAr: newModelAr.trim() || nameEn,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(
          data?.error === "MODEL_EXISTS"
            ? "الموديل موجود مسبقاً لهذه الماركة"
            : (data?.error ?? "تعذر إضافة الموديل"),
        );
        return;
      }
      setNewModelEn("");
      setNewModelAr("");
      setReloadToken((value) => value + 1);
      setMessage(`تمت إضافة ${nameEn} إلى ${make.nameEn}`);
    } finally {
      setBusy(false);
    }
  }

  async function reviewSuggestion(id: string, status: "approved" | "rejected") {
    setBusy(true);
    setMessage(null);
    try {
      const response = await adminFetch("/api/admin/option-suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        setMessage("تعذر مراجعة الاقتراح");
        return;
      }
      setReloadToken((value) => value + 1);
      setMessage(
        status === "approved"
          ? "تمت الموافقة وإضافة الموديل للكتالوج الحي"
          : "تم رفض اقتراح الموديل",
      );
    } finally {
      setBusy(false);
    }
  }

  const filtered = makes.filter((make) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const inMake =
      make.nameEn.toLowerCase().includes(q) ||
      make.nameAr.includes(query.trim()) ||
      make.slug.includes(q);
    if (inMake) return true;
    return (make.models ?? []).some(
      (model) =>
        model.nameEn.toLowerCase().includes(q) ||
        model.nameAr.includes(query.trim()) ||
        model.slug.includes(q),
    );
  });

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <h2 className="text-lg font-black text-ink">كتالوج السيارات</h2>
        <p className="mt-2 text-sm text-muted">
          عطّل ماركة/موديل أو أضف موديلاً جديداً دون نشر كود — يظهر فوراً في الإضافة والبحث بعد
          التفعيل.
        </p>
        {stats ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted">الماركات</dt>
              <dd className="font-bold text-ink">{stats.makesTotal}</dd>
            </div>
            <div>
              <dt className="text-muted">النشطة</dt>
              <dd className="font-bold text-ink">{stats.makesActive}</dd>
            </div>
            <div>
              <dt className="text-muted">الموديلات</dt>
              <dd className="font-bold text-ink">{stats.modelsTotal}</dd>
            </div>
            <div>
              <dt className="text-muted">مضافة من الإدارة</dt>
              <dd className="font-bold text-ink">{stats.modelsAdded ?? 0}</dd>
            </div>
          </dl>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm font-medium text-secondary">{message}</p>
        ) : null}
      </Card>

      <Card className="grid gap-3 p-5">
        <h3 className="text-base font-bold text-ink">اقتراحات موديلات من البائعين</h3>
        <p className="text-sm text-muted">
          عند اختيار «أخرى» وكتابة اقتراح موديل في إضافة إعلان سيارات، تصل هنا للموافقة قبل
          إضافتها للكتالوج.
        </p>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted">لا توجد اقتراحات معلّقة.</p>
        ) : (
          suggestions.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-border p-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{item.value}</p>
                <p className="text-xs text-muted">
                  {item.requestedByName ?? "بائع"} ·{" "}
                  {new Date(item.createdAt).toLocaleString(intlLocale(locale))}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={busy}
                  onClick={() => void reviewSuggestion(item.id, "approved")}
                  size="sm"
                  type="button"
                >
                  موافقة وإضافة
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => void reviewSuggestion(item.id, "rejected")}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  رفض
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Card className="p-5">
        <input
          className="mb-4 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث عن ماركة أو موديل (Toyota / Camry)"
          value={query}
        />
        <div className="max-h-[36rem] overflow-auto">
          <table className="w-full text-start text-sm">
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th className="px-2 py-2 font-semibold">الماركة / الموديل</th>
                <th className="px-2 py-2 font-semibold">عربي</th>
                <th className="px-2 py-2 font-semibold">المنشأ</th>
                <th className="px-2 py-2 font-semibold">موديلات</th>
                <th className="px-2 py-2 font-semibold">الحالة</th>
                <th className="px-2 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((make) => {
                const expanded = expandedMakeId === make.id;
                const models = make.models ?? [];
                return (
                  <Fragment key={make.id}>
                    <tr className="border-t border-border/70">
                      <td className="px-2 py-2 font-semibold text-ink">
                        <button
                          className="text-start font-semibold text-ink underline-offset-2 hover:underline"
                          onClick={() =>
                            setExpandedMakeId(expanded ? null : make.id)
                          }
                          type="button"
                        >
                          {expanded ? "▾ " : "▸ "}
                          {make.nameEn}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-ink">{make.nameAr}</td>
                      <td className="px-2 py-2 text-ink">
                        {make.countryNameAr || make.countryNameEn || "—"}
                      </td>
                      <td className="px-2 py-2 text-ink">{make.modelCount}</td>
                      <td className="px-2 py-2">
                        {make.disabled ? (
                          <span className="text-error">معطّلة</span>
                        ) : (
                          <span className="text-success">نشطة</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            disabled={busy}
                            onClick={() =>
                              setExpandedMakeId(expanded ? null : make.id)
                            }
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {expanded ? "إخفاء الموديلات" : "الموديلات"}
                          </Button>
                          <Button
                            disabled={busy}
                            onClick={() => void toggleMake(make)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            {make.disabled ? "تفعيل" : "تعطيل"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <>
                        {models.map((model) => (
                          <tr
                            key={model.id}
                            className="border-t border-border/40 bg-surface/50"
                          >
                            <td className="px-2 py-2 ps-8 text-ink">
                              {model.nameEn}
                              {model.added ? (
                                <span className="ms-2 text-[0.65rem] font-bold text-secondary">
                                  مضاف
                                </span>
                              ) : null}
                            </td>
                            <td className="px-2 py-2 text-ink">
                              {model.nameAr}
                            </td>
                            <td className="px-2 py-2 text-muted">—</td>
                            <td className="px-2 py-2" />
                            <td className="px-2 py-2">
                              {model.disabled ? (
                                <span className="text-error">معطّل</span>
                              ) : (
                                <span className="text-success">نشط</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <Button
                                disabled={busy || !model.active}
                                onClick={() => void toggleModel(model)}
                                size="sm"
                                type="button"
                                variant="secondary"
                              >
                                {!model.active
                                  ? "غير نشط في الكتالوج"
                                  : model.disabled
                                    ? "تفعيل"
                                    : "تعطيل"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-border/40 bg-secondary-soft/30">
                          <td className="px-2 py-3 ps-8" colSpan={6}>
                            <div className="flex flex-wrap items-end gap-2">
                              <label className="grid gap-1 text-xs text-muted">
                                موديل جديد (EN)
                                <input
                                  className="min-w-[10rem] rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink"
                                  onChange={(event) =>
                                    setNewModelEn(event.target.value)
                                  }
                                  placeholder="e.g. Raize Cross"
                                  value={newModelEn}
                                />
                              </label>
                              <label className="grid gap-1 text-xs text-muted">
                                عربي (اختياري)
                                <input
                                  className="min-w-[10rem] rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink"
                                  onChange={(event) =>
                                    setNewModelAr(event.target.value)
                                  }
                                  placeholder="اسم عربي"
                                  value={newModelAr}
                                />
                              </label>
                              <Button
                                disabled={busy}
                                onClick={() => void addModel(make)}
                                size="sm"
                                type="button"
                              >
                                إضافة موديل لـ {make.nameEn}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
