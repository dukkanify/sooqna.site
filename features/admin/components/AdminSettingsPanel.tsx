"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { persistSessionCookie } from "@/services/auth/session-sync";
import { useEffect, useState } from "react";
import type { AdminSiteSettings } from "@/services/admin/admin-settings-store";
import { getSessionUser, setSessionUser } from "@/services/storage";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { STRONG_PASSWORD_HINT } from "@/shared/utils/password-rules";
import { OPERATOR_ADMIN_EMAIL } from "@/shared/constants/operator-admin";
import type { UserProfile } from "@/types";

export function AdminSettingsPanel() {
  const locale = useLocale();
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) setSettings(data.settings as AdminSiteSettings);
      })
      .catch(() => undefined);
  }, []);

  async function handleSave() {
    if (!settings) return;
    const user = getSessionUser();
    setSaving(true);
    setMessage("");
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          actorId: user?.id,
          actorName: user?.fullName,
        }),
      });
      const data = await res.json();
      if (data?.settings) {
        setSettings(data.settings as AdminSiteSettings);
        setMessage("تم حفظ إعدادات الموقع.");
      } else {
        setMessage("تعذّر الحفظ.");
      }
    } catch {
      setMessage("تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword() {
    setPasswordSaving(true);
    setMessage("");
    try {
      const res = await adminFetch("/api/admin/account/password", {
        method: "POST",
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "تعذر حفظ كلمة المرور.");
        return;
      }
      if (data.user) {
        setSessionUser(data.user as UserProfile);
        await persistSessionCookie();
      }
      setNewPassword("");
      setConfirmPassword("");
      setMessage("تم حفظ كلمة مرور الدخول.");
    } catch {
      setMessage("تعذر حفظ كلمة المرور.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="admin-desk grid gap-4">
        <Card className="admin-desk-table-card p-8 text-center" variant="flat">
          <p className="text-sm text-muted">جاري تحميل الإعدادات...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          إعدادات المنصة — الرسوم، المدفوعات، والسياسات التشغيلية.
        </p>
      </div>

      <Card className="admin-desk-help p-5" variant="flat">
        <h2 className="text-sm font-semibold text-ink">الرسوم والمدفوعات</h2>
        <p className="mt-2 text-xs text-muted">
          نسبة المنصة هي التي يراها المشتري وتُضاف على سعر الإعلان في Stripe.
          تكلفة بوابة الدفع تقدير داخلي للتقارير، وتُخصم من هامش المنصة ولا تُضاف
          فوق المشتري.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input
            label="رسوم المنصة %"
            type="number"
            value={String(settings.platformFeePercent)}
            onChange={(e) =>
              setSettings({
                ...settings,
                platformFeePercent: Number(e.target.value),
              })
            }
          />
          <Input
            label="تكلفة البوابة % (داخلي)"
            type="number"
            value={String(settings.gatewayFeePercent)}
            onChange={(e) =>
              setSettings({
                ...settings,
                gatewayFeePercent: Number(e.target.value),
              })
            }
          />
          <Input
            label="تكلفة ثابتة (AED، داخلي)"
            type="number"
            value={String(settings.gatewayFeeFixed)}
            onChange={(e) =>
              setSettings({
                ...settings,
                gatewayFeeFixed: Number(e.target.value),
              })
            }
          />
        </div>
      </Card>

      <Card className="admin-desk-help p-5" variant="flat">
        <h2 className="text-sm font-semibold text-ink">تشغيل الموقع</h2>
        <p className="mt-2 text-xs text-muted">
          مدد الضمان والنزاعات والتميّز، مع سياسات التشغيل الأساسية.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="أيام حجز الضمان"
            type="number"
            value={String(settings.escrowHoldDays)}
            onChange={(e) =>
              setSettings({
                ...settings,
                escrowHoldDays: Number(e.target.value),
              })
            }
          />
          <Input
            label="مهلة النزاع (أيام)"
            type="number"
            value={String(settings.disputeWindowDays)}
            onChange={(e) =>
              setSettings({
                ...settings,
                disputeWindowDays: Number(e.target.value),
              })
            }
          />
          <Input
            label="مدة نشاط الإعلان (أيام)"
            type="number"
            value={String(settings.listingActiveDays)}
            onChange={(e) =>
              setSettings({
                ...settings,
                listingActiveDays: Number(e.target.value),
              })
            }
          />
          <Input
            label="رسوم الإعلان المميز (AED)"
            type="number"
            value={String(settings.featuredListingFeeAed)}
            onChange={(e) =>
              setSettings({
                ...settings,
                featuredListingFeeAed: Number(e.target.value),
              })
            }
          />
          <Input
            label="مدة التمييز (أيام)"
            type="number"
            value={String(settings.featuredListingDays)}
            onChange={(e) =>
              setSettings({
                ...settings,
                featuredListingDays: Number(e.target.value),
              })
            }
          />
          <Input
            label="بريد الدعم"
            type="email"
            value={settings.supportEmail}
            onChange={(e) =>
              setSettings({
                ...settings,
                supportEmail: e.target.value,
              })
            }
          />
          <Input
            label="رابط لوحة Stripe"
            value={settings.stripeDashboardUrl}
            onChange={(e) =>
              setSettings({
                ...settings,
                stripeDashboardUrl: e.target.value,
              })
            }
          />
        </div>
        <div className="mt-4 grid gap-3">
          <label className="admin-ops__toggle">
            <input
              checked={settings.maintenanceMode}
              type="checkbox"
              onChange={(e) =>
                setSettings({ ...settings, maintenanceMode: e.target.checked })
              }
            />
            <span>وضع الصيانة (إيقاف مؤقت للعمليات الحساسة)</span>
          </label>
          <label className="admin-ops__toggle">
            <input
              checked={settings.allowGuestCheckout}
              type="checkbox"
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowGuestCheckout: e.target.checked,
                })
              }
            />
            <span>السماح بالشراء كضيف</span>
          </label>
          <label className="admin-ops__toggle">
            <input
              checked={settings.autoApproveUsers}
              type="checkbox"
              onChange={(e) =>
                setSettings({
                  ...settings,
                  autoApproveUsers: e.target.checked,
                })
              }
            />
            <span>اعتماد الحساب تلقائياً بعد التحقق من البريد</span>
          </label>
        </div>
      </Card>

      <Card className="admin-desk-help p-5" variant="flat">
        <h2 className="text-sm font-semibold text-ink">كلمة مرور الدخول</h2>
        <p className="mt-2 text-xs text-muted">
          حساب الدخول: {OPERATOR_ADMIN_EMAIL}. غيّر كلمة المرور من هنا بعد الدخول.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            autoComplete="new-password"
            hint={STRONG_PASSWORD_HINT}
            label="كلمة المرور الجديدة"
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            value={newPassword}
          />
          <Input
            autoComplete="new-password"
            label="تأكيد كلمة المرور"
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            value={confirmPassword}
          />
        </div>
        <div className="mt-4">
          <Button
            disabled={passwordSaving || !newPassword}
            onClick={() => void handleSavePassword()}
            type="button"
            variant="secondary"
          >
            {passwordSaving ? "جاري الحفظ..." : "حفظ كلمة المرور"}
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={saving} onClick={handleSave} type="button">
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
        {message ? (
          <p className="text-sm font-semibold text-ink">{message}</p>
        ) : null}
      </div>
      <p className="text-xs text-muted">
        آخر تحديث: {new Date(settings.updatedAt).toLocaleString(intlLocale(locale))}
      </p>
    </div>
  );
}
