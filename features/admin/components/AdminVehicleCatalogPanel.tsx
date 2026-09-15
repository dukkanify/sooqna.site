"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

type MakeRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  status: string;
  disabled: boolean;
  modelCount: number;
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

  const filtered = makes.filter((make) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      make.nameEn.toLowerCase().includes(q) ||
      make.nameAr.includes(query.trim()) ||
      make.slug.includes(q)
    );
  });

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <h2 className="text-lg font-black text-ink">كتالوج السيارات المرجعي</h2>
        <p className="mt-2 text-sm text-muted">
          بيانات مرجعية (Make → Model) وليست إعلانات سوق. يمكن تعطيل ماركة من
          الظهور في نماذج الإضافة/البحث دون حذف السجل.
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
          placeholder="ابحث عن ماركة (Toyota / تويوتا)"
          value={query}
        />
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-start text-sm">
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th className="px-2 py-2 font-semibold">الماركة</th>
                <th className="px-2 py-2 font-semibold">عربي</th>
                <th className="px-2 py-2 font-semibold">موديلات</th>
                <th className="px-2 py-2 font-semibold">الحالة</th>
                <th className="px-2 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((make) => (
                <tr key={make.id} className="border-t border-border/70">
                  <td className="px-2 py-2 font-semibold text-ink">
                    {make.nameEn}
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
                    <Button
                      disabled={busy}
                      onClick={() => void toggleMake(make)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {make.disabled ? "تفعيل" : "تعطيل"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
