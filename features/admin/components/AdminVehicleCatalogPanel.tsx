"use client";

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
};

type MakeRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  status: string;
  disabled: boolean;
  modelCount: number;
  models?: ModelRow[];
};

type Stats = {
  makesTotal: number;
  makesActive: number;
  modelsTotal: number;
};

export function AdminVehicleCatalogPanel() {
  const [makes, setMakes] = useState<MakeRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [expandedMakeId, setExpandedMakeId] = useState<string | null>(null);

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
          عطّل ماركة أو موديل من الظهور في نماذج الإضافة والبحث دون حذف البيانات.
        </p>
        {stats ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
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
          </dl>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm font-medium text-secondary">{message}</p>
        ) : null}
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
                    {expanded
                      ? models.map((model) => (
                          <tr
                            key={model.id}
                            className="border-t border-border/40 bg-surface/50"
                          >
                            <td className="px-2 py-2 ps-8 text-ink">
                              {model.nameEn}
                            </td>
                            <td className="px-2 py-2 text-ink">
                              {model.nameAr}
                            </td>
                            <td className="px-2 py-2 text-muted">—</td>
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
                        ))
                      : null}
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
