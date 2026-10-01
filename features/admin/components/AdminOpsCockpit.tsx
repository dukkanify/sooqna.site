"use client";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSessionUser } from "@/services/storage";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";
import type { IconName } from "@/shared/ui/Icon";

type Severity = "critical" | "high" | "medium" | "low";

type KpiCard = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  href: string;
  icon: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  money?: boolean;
};

type ActionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  severity: Severity;
  oldestAgeLabel?: string;
  meta?: string;
};

type QueueItem = {
  id: string;
  label: string;
  count: number;
  severity: Severity;
  oldestAgeLabel?: string;
  href: string;
  actionLabel: string;
};

type DashboardPayload = {
  rangeDays: number;
  executive: KpiCard[];
  platform: {
    totalListings: number;
    activeListings: number;
    pendingListings: number;
    rejectedListings: number;
    totalUsers: number;
    newUsers: number;
    totalViews: number | null;
    engagement: number | null;
    topCategories: Array<{
      key: string;
      label: string;
      listings: number;
      views: number;
      viewSharePercent: number;
      href: string;
    }>;
    topListings: Array<{
      id: string;
      title: string;
      categoryLabel: string;
      sellerName: string;
      status: string;
      views: number;
      favorites: number;
      href: string;
    }>;
  } | null;
  financial:
    | {
        available: true;
        /** GMV (merchandise / productPrice). */
        transactionVolume: number;
        revenue: number;
        netProfit: number;
        gatewayFees?: number;
        buyerCollected?: number;
        heldEscrowAmount: number;
        heldEscrowCount: number;
        releasedEscrowAmount?: number;
        releasedEscrowCount?: number;
        successfulPayments: number;
        pendingPayments: number;
        refundedAmount: number;
        refundedCount: number;
        currency: string;
      }
    | { available: false; message: string }
    | null;
  operations: { queues: QueueItem[] };
  risk: {
    openDisputes: number;
    underReview: number;
    unresolved: number;
    overdueEscrow: number;
    needsAdminIntervention: number;
    highPriorityDisputes: number;
    incompleteEvidence: number;
    items: Array<{
      label: string;
      count: number;
      severity: Severity;
      href: string;
    }>;
  };
  actionCenter: ActionItem[];
  trends: {
    daily: Array<{
      date: string;
      label: string;
      orders: number;
      volume: number;
      fees: number;
    }>;
  };
  categoryPerformance: Array<{
    key: string;
    label: string;
    listings: number;
    views: number;
    viewSharePercent: number;
    href: string;
  }>;
  topListings: Array<{
    id: string;
    title: string;
    categoryLabel: string;
    sellerName: string;
    status: string;
    views: number;
    favorites: number;
    href: string;
  }>;
  recentActivity: Array<{
    id: string;
    event: string;
    actor: string;
    timestamp: string;
    href: string;
  }>;
  shortcuts: Array<{ href: string; label: string }>;
  stripe: { configured: boolean; currency: string };
  settings: { maintenanceMode: boolean; platformFeePercent: number; escrowHoldDays: number };
};

const severityLabel: Record<Severity, string> = {
  critical: "حرج",
  high: "عالي",
  medium: "متوسط",
  low: "منخفض",
};

const ranges = [
  { days: 7, label: "7 أيام" },
  { days: 30, label: "30 يوم" },
  { days: 90, label: "90 يوم" },
] as const;

function toneClass(tone?: KpiCard["tone"]) {
  if (tone === "success") return "admin-dash__kpi--success";
  if (tone === "warning") return "admin-dash__kpi--warning";
  if (tone === "danger") return "admin-dash__kpi--danger";
  return "";
}

function severityClass(severity: Severity) {
  return `admin-dash__severity admin-dash__severity--${severity}`;
}

function asIcon(name: string): IconName {
  const allowed: IconName[] = [
    "grid",
    "check",
    "clock",
    "user",
    "plus",
    "wallet",
    "shield",
    "message",
    "package",
    "chart",
    "bell",
  ];
  return (allowed.includes(name as IconName) ? name : "grid") as IconName;
}

export function AdminOpsCockpit() {
  const locale = useLocale();
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(async (nextRange: 7 | 30 | 90) => {
    setLoading(true);
    setError("");
    try {
      const user = getSessionUser();
      if (!user || user.role !== "admin") {
        setError("غير مصرح");
        setData(null);
        return;
      }
      const res = await adminFetch(`/api/admin/dashboard/summary?range=${nextRange}`);
      const json = await res.json();
      if (!res.ok || !json?.executive) {
        setError(json?.message || "تعذر تحميل هذه البيانات");
        setData(null);
        return;
      }
      setData(json as DashboardPayload);
    } catch {
      setError("تعذر تحميل هذه البيانات");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load(range);
    }, 0);
    return () => window.clearTimeout(id);
  }, [load, range]);

  if (loading && !data) {
    return (
      <LocalizedTree>
        <div className="admin-dash admin-dash--loading">
          <Card className="admin-desk-table-card p-6" variant="flat">
            <div className="admin-dash__skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="admin-dash__skeleton-card" />
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-muted">جاري تحميل لوحة التحكم...</p>
          </Card>
        </div>
      </LocalizedTree>
    );
  }

  if (error && !data) {
    return (
      <LocalizedTree>
        <Card className="admin-desk-table-card p-8 text-center" variant="flat">
          <p className="text-sm text-muted">{error}</p>
          <button
            className="mt-4 text-sm font-semibold text-primary"
            onClick={() => void load(range)}
            type="button"
          >
            إعادة المحاولة
          </button>
        </Card>
      </LocalizedTree>
    );
  }

  if (!data) return null;

  const trendHasData = data.trends.daily.some((d) => d.orders > 0 || d.volume > 0);
  const maxVolume = Math.max(...data.trends.daily.map((d) => d.volume), 1);
  const categoryRows = data.categoryPerformance.slice(0, 8);

  return (
    <LocalizedTree>
      <div className="admin-desk admin-dash grid gap-4">
        <div className="admin-desk-toolbar">
          <p className="text-sm text-muted">
            غرفة التحكم — نظرة تنفيذية على الطوابير، المال، والأداء.
          </p>
        </div>
        <div className="admin-dash__toolbar">
          <div className="admin-dash__status">
            <span
              className={`admin-dash__chip${
                data.stripe.configured ? " admin-dash__chip--ok" : " admin-dash__chip--warn"
              }`}
            >
              Stripe {data.stripe.configured ? "متصل" : "غير مفعّل"} ·{" "}
              {data.stripe.currency.toUpperCase()}
            </span>
            <span className="admin-dash__chip">
              رسوم {data.settings.platformFeePercent}%
            </span>
            <span
              className={`admin-dash__chip${
                data.settings.maintenanceMode
                  ? " admin-dash__chip--warn"
                  : " admin-dash__chip--ok"
              }`}
            >
              {data.settings.maintenanceMode ? "صيانة" : "تشغيل عادي"}
            </span>
          </div>
          <div className="admin-dash__toolbar-actions">
            <div className="admin-dash__range" role="group" aria-label="نطاق زمني">
              {ranges.map((item) => (
                <button
                  key={item.days}
                  className={`admin-dash__range-btn${
                    range === item.days ? " is-active" : ""
                  }`}
                  onClick={() => setRange(item.days)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              className="admin-dash__refresh"
              onClick={() => void load(range)}
              type="button"
            >
              تحديث
            </button>
          </div>
        </div>

        {/* Executive KPIs */}
        <Card className="admin-desk-table-card p-4" variant="flat">
          <div className="admin-dash__section-head">
            <h2 className="admin-dash__section-title">ملخص سريع</h2>
            <p className="admin-dash__section-sub">أرقام اليوم بلمحة واحدة</p>
          </div>
          <div className="admin-dash__kpi-grid">
            {data.executive.map((card) => (
              <Link
                key={card.key}
                className={`admin-dash__kpi ${toneClass(card.tone)}`}
                href={card.href}
              >
                <div className="admin-dash__kpi-top">
                  <span className="admin-dash__kpi-icon">
                    <Icon name={asIcon(card.icon)} size={16} />
                  </span>
                  <p className="admin-dash__kpi-label">{card.label}</p>
                </div>
                <div className="admin-dash__kpi-value">
                  {card.money && typeof card.value === "number" ? (
                    <CurrencyAmount amount={card.value} size="md" />
                  ) : (
                    <span>
                      {typeof card.value === "number"
                        ? card.value.toLocaleString(intlLocale(locale))
                        : card.value}
                    </span>
                  )}
                </div>
                {card.hint ? <p className="admin-dash__kpi-hint">{card.hint}</p> : null}
              </Link>
            ))}
          </div>
        </Card>

        {/* Action Center — prioritize on small screens via CSS order */}
        <section className="admin-dash__section admin-dash__section--action">
          <div className="admin-dash__section-head">
            <h2 className="admin-dash__section-title">يحتاج متابعة</h2>
            <p className="admin-dash__section-sub">ابدأ من هنا — أهم ما ينتظرك الآن</p>
          </div>
          {data.actionCenter.length === 0 ? (
            <Card className="p-5" variant="flat">
              <p className="text-sm text-muted">لا توجد عناصر تحتاج متابعة حالياً.</p>
            </Card>
          ) : (
            <ul className="admin-dash__action-list">
              {data.actionCenter.map((item) => (
                <li key={item.id}>
                  <Link className="admin-dash__action-item" href={item.href}>
                    <div>
                      <p className="admin-dash__action-label">
                        {item.count.toLocaleString(intlLocale(locale))} {item.label}
                      </p>
                      <p className="admin-dash__action-meta">
                        {[item.meta, item.oldestAgeLabel].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className={severityClass(item.severity)}>
                      {severityLabel[item.severity]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="admin-dash__details-toggle">
          <button
            className="admin-dash__range-btn"
            onClick={() => setShowDetails((open) => !open)}
            type="button"
          >
            {showDetails ? "إخفاء التفاصيل" : "المزيد من المؤشرات"}
          </button>
        </div>

        {showDetails ? (
          <>
        <div className="admin-dash__split">
          {/* Platform */}
          <section className="admin-dash__section">
            <div className="admin-dash__section-head">
              <h2 className="admin-dash__section-title">مؤشرات المنصة</h2>
            </div>
            {!data.platform ? (
              <p className="text-sm text-muted">لا تتوفر صلاحية عرض مؤشرات المنصة.</p>
            ) : (
              <div className="admin-dash__stat-grid">
                <div className="admin-dash__stat">
                  <span>إجمالي الإعلانات</span>
                  <strong>{data.platform.totalListings.toLocaleString(intlLocale(locale))}</strong>
                </div>
                <div className="admin-dash__stat">
                  <span>المنشورة</span>
                  <strong>{data.platform.activeListings.toLocaleString(intlLocale(locale))}</strong>
                </div>
                <div className="admin-dash__stat">
                  <span>المعلقة</span>
                  <strong>{data.platform.pendingListings.toLocaleString(intlLocale(locale))}</strong>
                </div>
                <div className="admin-dash__stat">
                  <span>المرفوضة</span>
                  <strong>{data.platform.rejectedListings.toLocaleString(intlLocale(locale))}</strong>
                </div>
                <div className="admin-dash__stat">
                  <span>المستخدمون</span>
                  <strong>{data.platform.totalUsers.toLocaleString(intlLocale(locale))}</strong>
                </div>
                <div className="admin-dash__stat">
                  <span>المستخدمون الجدد</span>
                  <strong>{data.platform.newUsers.toLocaleString(intlLocale(locale))}</strong>
                </div>
                {data.platform.totalViews != null ? (
                  <div className="admin-dash__stat">
                    <span>إجمالي المشاهدات</span>
                    <strong>{data.platform.totalViews.toLocaleString(intlLocale(locale))}</strong>
                  </div>
                ) : null}
                {data.platform.engagement != null ? (
                  <div className="admin-dash__stat">
                    <span>التفاعل (مفضلة)</span>
                    <strong>{data.platform.engagement.toLocaleString(intlLocale(locale))}</strong>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* Financial */}
          <section className="admin-dash__section">
            <div className="admin-dash__section-head">
              <h2 className="admin-dash__section-title">المؤشرات المالية</h2>
            </div>
            {!data.financial ? (
              <p className="text-sm text-muted">لا تتوفر صلاحية عرض البيانات المالية.</p>
            ) : !data.financial.available ? (
              <Card className="p-5" variant="flat">
                <p className="text-sm text-muted">{data.financial.message}</p>
              </Card>
            ) : (
              <div className="admin-dash__stat-grid">
                <div className="admin-dash__stat">
                  <span>GMV (قيمة البضائع)</span>
                  <strong>
                    <CurrencyAmount amount={data.financial.transactionVolume} size="sm" />
                  </strong>
                </div>
                <div className="admin-dash__stat">
                  <span>عمولات المنصة</span>
                  <strong>
                    <CurrencyAmount amount={data.financial.revenue} size="sm" />
                  </strong>
                </div>
                <div className="admin-dash__stat">
                  <span>صافي إيراد المنصة</span>
                  <strong>
                    <CurrencyAmount amount={data.financial.netProfit} size="sm" />
                  </strong>
                </div>
                <div className="admin-dash__stat">
                  <span>محتجز في مضمون</span>
                  <strong>
                    <CurrencyAmount amount={data.financial.heldEscrowAmount} size="sm" />
                  </strong>
                </div>
                <div className="admin-dash__stat">
                  <span>محرّر من الضمان</span>
                  <strong>
                    <CurrencyAmount
                      amount={data.financial.releasedEscrowAmount ?? 0}
                      size="sm"
                    />
                  </strong>
                </div>
                <div className="admin-dash__stat">
                  <span>مدفوعات ناجحة</span>
                  <strong>{data.financial.successfulPayments.toLocaleString(intlLocale(locale))}</strong>
                </div>
                <div className="admin-dash__stat">
                  <span>مدفوعات معلّقة</span>
                  <strong>{data.financial.pendingPayments.toLocaleString(intlLocale(locale))}</strong>
                </div>
                <div className="admin-dash__stat">
                  <span>المبالغ المستردة</span>
                  <strong>
                    <CurrencyAmount amount={data.financial.refundedAmount} size="sm" />
                  </strong>
                </div>
                <div className="admin-dash__stat">
                  <span>عمليات مضمون المحجوزة</span>
                  <strong>{data.financial.heldEscrowCount.toLocaleString(intlLocale(locale))}</strong>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Trends */}
        <Card className="admin-desk-help p-4" variant="flat">
          <div className="admin-dash__section-head">
            <h2 className="admin-dash__section-title">الاتجاهات</h2>
            <p className="admin-dash__section-sub">
              GMV للمدفوعات الناجحة — آخر {data.rangeDays} يوم
            </p>
          </div>
          {!trendHasData ? (
            <p className="text-sm text-muted">
              لا تتوفر بيانات مالية كافية لهذا النطاق الزمني.
            </p>
          ) : (
            <div className="admin-dash__bars" role="img" aria-label="مخطط حجم المدفوعات">
              {data.trends.daily.map((point) => (
                <div key={point.date} className="admin-dash__bar-col">
                  <div className="admin-dash__bar-track">
                    <div
                      className="admin-dash__bar-fill"
                      style={{
                        height: `${Math.max(8, (point.volume / maxVolume) * 100)}%`,
                      }}
                      title={`${point.volume} AED · ${point.orders} طلب`}
                    />
                  </div>
                  <p className="admin-dash__bar-value">{point.orders}</p>
                  <p className="admin-dash__bar-label">{point.label}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Operations */}
        <section className="admin-dash__section">
          <div className="admin-dash__section-head">
            <h2 className="admin-dash__section-title">التشغيل والإشراف</h2>
            <p className="admin-dash__section-sub">طوابير العمل التي تحتاج متابعة</p>
          </div>
          <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
            <div className="admin-desk-table-scroll">
              <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
                <thead>
                  <tr>
                    <th>الطابور</th>
                    <th>العدد</th>
                    <th>الأقدم</th>
                    <th>الأولوية</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operations.queues.length === 0 ? (
                    <tr>
                      <td className="text-muted" colSpan={5}>
                        لا توجد طوابير حالياً.
                      </td>
                    </tr>
                  ) : (
                    data.operations.queues.map((queue) => (
                      <tr key={queue.id}>
                        <td className="admin-desk-cell-wrap">
                          <p className="admin-desk-cell-title font-bold text-ink">
                            {queue.label}
                          </p>
                        </td>
                        <td className="font-bold text-ink">
                          {queue.count.toLocaleString(intlLocale(locale))}
                        </td>
                        <td className="text-sm text-muted">
                          {queue.oldestAgeLabel ||
                            (queue.count === 0 ? "لا عناصر معلّقة" : "—")}
                        </td>
                        <td>
                          <span className={severityClass(queue.severity)}>
                            {severityLabel[queue.severity]}
                          </span>
                        </td>
                        <td>
                          <Button href={queue.href} size="sm" variant="secondary">
                            {queue.actionLabel}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <ul className="admin-desk-mobile-list">
              {data.operations.queues.length === 0 ? (
                <li className="admin-desk-mobile-card">
                  <p className="text-sm text-muted">لا توجد طوابير حالياً.</p>
                </li>
              ) : (
                data.operations.queues.map((queue) => (
                  <li key={queue.id} className="admin-desk-mobile-card">
                    <div className="admin-desk-mobile-card__head">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">{queue.label}</p>
                        <p className="text-xs text-muted">
                          {queue.oldestAgeLabel ||
                            (queue.count === 0 ? "لا عناصر معلّقة" : "—")}
                        </p>
                      </div>
                      <span className={severityClass(queue.severity)}>
                        {severityLabel[queue.severity]}
                      </span>
                    </div>
                    <div className="admin-desk-mobile-card__meta">
                      <span>
                        العدد {queue.count.toLocaleString(intlLocale(locale))}
                      </span>
                    </div>
                    <div className="admin-desk-mobile-card__actions">
                      <Button href={queue.href} size="sm" variant="secondary">
                        {queue.actionLabel}
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </section>

        {/* Disputes & Risk */}
        <section className="admin-dash__section admin-dash__section--risk">
          <div className="admin-dash__section-head">
            <h2 className="admin-dash__section-title">النزاعات والمخاطر</h2>
            <p className="admin-dash__section-sub">أولوية تشغيلية للمخاطر الحية</p>
          </div>
          <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
            <div className="admin-desk-table-scroll">
              <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
                <thead>
                  <tr>
                    <th>الطابور</th>
                    <th>العدد</th>
                    <th>الأقدم</th>
                    <th>الأولوية</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {data.risk.items.length === 0 ? (
                    <tr>
                      <td className="text-muted" colSpan={5}>
                        لا توجد مخاطر معلّقة.
                      </td>
                    </tr>
                  ) : (
                    data.risk.items.map((item) => (
                      <tr key={item.label}>
                        <td className="admin-desk-cell-wrap">
                          <p className="admin-desk-cell-title font-bold text-ink">
                            {item.label}
                          </p>
                        </td>
                        <td className="font-bold text-ink">
                          {item.count.toLocaleString(intlLocale(locale))}
                        </td>
                        <td className="text-sm text-muted">—</td>
                        <td>
                          <span className={severityClass(item.severity)}>
                            {severityLabel[item.severity]}
                          </span>
                        </td>
                        <td>
                          <Button href={item.href} size="sm" variant="secondary">
                            فتح
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <ul className="admin-desk-mobile-list">
              {data.risk.items.length === 0 ? (
                <li className="admin-desk-mobile-card">
                  <p className="text-sm text-muted">لا توجد مخاطر معلّقة.</p>
                </li>
              ) : (
                data.risk.items.map((item) => (
                  <li key={item.label} className="admin-desk-mobile-card">
                    <div className="admin-desk-mobile-card__head">
                      <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                        {item.label}
                      </p>
                      <span className={severityClass(item.severity)}>
                        {severityLabel[item.severity]}
                      </span>
                    </div>
                    <div className="admin-desk-mobile-card__meta">
                      <span>
                        العدد {item.count.toLocaleString(intlLocale(locale))}
                      </span>
                    </div>
                    <div className="admin-desk-mobile-card__actions">
                      <Button href={item.href} size="sm" variant="secondary">
                        فتح
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </section>

        <div className="admin-dash__split">
          {/* Categories */}
          <section className="admin-dash__section">
            <div className="admin-dash__section-head">
              <h2 className="admin-dash__section-title">أداء الأقسام</h2>
            </div>
            {categoryRows.length === 0 ? (
              <p className="text-sm text-muted">لا تتوفر بيانات أقسام حالياً.</p>
            ) : (
              <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
                <div className="admin-desk-table-scroll">
                  <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
                    <thead>
                      <tr>
                        <th>القسم</th>
                        <th>إعلانات</th>
                        <th>مشاهدات</th>
                        <th>حصة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRows.map((cat) => (
                        <tr key={cat.key}>
                          <td className="admin-desk-cell-wrap">
                            <Link className="admin-desk-cell-title font-bold text-ink" href={cat.href}>
                              {cat.label}
                            </Link>
                          </td>
                          <td>{cat.listings.toLocaleString(intlLocale(locale))}</td>
                          <td>{cat.views.toLocaleString(intlLocale(locale))}</td>
                          <td>{cat.viewSharePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="admin-desk-mobile-list">
                  {categoryRows.map((cat) => (
                    <li key={cat.key} className="admin-desk-mobile-card">
                      <div className="admin-desk-mobile-card__head">
                        <Link
                          className="min-w-0 flex-1 text-sm font-bold text-ink"
                          href={cat.href}
                        >
                          {cat.label}
                        </Link>
                        <span className="text-sm font-bold text-ink">
                          {cat.viewSharePercent}%
                        </span>
                      </div>
                      <div className="admin-desk-mobile-card__meta">
                        <span>
                          {cat.listings.toLocaleString(intlLocale(locale))} إعلان
                        </span>
                        <span>
                          {cat.views.toLocaleString(intlLocale(locale))} مشاهدة
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

          {/* Top listings */}
          <section className="admin-dash__section">
            <div className="admin-dash__section-head">
              <h2 className="admin-dash__section-title">أكثر الإعلانات نشاطًا</h2>
            </div>
            {data.topListings.length === 0 ? (
              <p className="text-sm text-muted">لا تتوفر إعلانات مرتبة حالياً.</p>
            ) : (
              <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
                <div className="admin-desk-table-scroll">
                  <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
                    <thead>
                      <tr>
                        <th>العنوان</th>
                        <th>القسم</th>
                        <th>البائع</th>
                        <th>المشاهدات</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topListings.map((row) => (
                        <tr key={row.id}>
                          <td className="admin-desk-cell-wrap">
                            <Link
                              className="admin-desk-cell-title font-bold text-ink"
                              href={row.href}
                            >
                              {row.title}
                            </Link>
                          </td>
                          <td className="admin-desk-cell-wrap text-sm text-muted">
                            {row.categoryLabel}
                          </td>
                          <td className="admin-desk-cell-wrap text-sm text-muted">
                            {row.sellerName}
                          </td>
                          <td>{row.views.toLocaleString(intlLocale(locale))}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="admin-desk-mobile-list">
                  {data.topListings.map((row) => (
                    <li key={row.id} className="admin-desk-mobile-card">
                      <div className="admin-desk-mobile-card__head">
                        <Link
                          className="min-w-0 flex-1 text-sm font-bold text-ink"
                          href={row.href}
                        >
                          {row.title}
                        </Link>
                        <span className="text-xs font-bold text-muted">{row.status}</span>
                      </div>
                      <div className="admin-desk-mobile-card__meta">
                        <span>{row.categoryLabel}</span>
                        <span>{row.sellerName}</span>
                        <span>
                          {row.views.toLocaleString(intlLocale(locale))} مشاهدة
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        {/* Recent + shortcuts */}
        <div className="admin-dash__split">
          <section className="admin-dash__section">
            <div className="admin-dash__section-head">
              <h2 className="admin-dash__section-title">آخر النشاطات</h2>
            </div>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted">لا نشاطات حديثة.</p>
            ) : (
              <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
                <div className="admin-desk-table-scroll">
                  <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
                    <thead>
                      <tr>
                        <th>الحدث</th>
                        <th>الفاعل</th>
                        <th>الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentActivity.map((item) => (
                        <tr key={item.id}>
                          <td className="admin-desk-cell-wrap">
                            <Link
                              className="admin-desk-cell-title font-bold text-ink"
                              href={item.href}
                            >
                              {item.event}
                            </Link>
                          </td>
                          <td className="text-sm text-muted">{item.actor}</td>
                          <td className="text-sm text-muted">
                            {item.timestamp
                              ? new Date(item.timestamp).toLocaleString(intlLocale(locale))
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="admin-desk-mobile-list">
                  {data.recentActivity.map((item) => (
                    <li key={item.id} className="admin-desk-mobile-card">
                      <div className="admin-desk-mobile-card__head">
                        <Link
                          className="min-w-0 flex-1 text-sm font-bold text-ink"
                          href={item.href}
                        >
                          {item.event}
                        </Link>
                      </div>
                      <div className="admin-desk-mobile-card__meta">
                        <span>{item.actor}</span>
                        <span>
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleString(intlLocale(locale))
                            : "—"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

          <Card className="admin-desk-help p-4" variant="flat">
            <div className="admin-dash__section-head">
              <h2 className="admin-dash__section-title">اختصارات سريعة</h2>
            </div>
            <div className="admin-dash__shortcuts flex flex-wrap gap-2">
              {data.shortcuts.map((item) => (
                <Button
                  key={item.href + item.label}
                  href={item.href}
                  size="sm"
                  variant="secondary"
                >
                  {item.label}
                </Button>
              ))}
              <Button href="/admin/reports" size="sm" variant="ghost">
                التقارير / التصدير
              </Button>
            </div>
          </Card>
        </div>
          </>
        ) : null}
      </div>
    </LocalizedTree>
  );
}
