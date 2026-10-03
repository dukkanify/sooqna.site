"use client";

import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { emailEventTypeLabel, notificationTypeLabel } from "@/shared/display/event-type-labels";
import { humanDisplayLabel } from "@/shared/display/technical-id";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AppNotification } from "@/types/domain/notification";
import type { EmailLogRecord } from "@/services/email/email-log-store";
import { getSessionUser } from "@/services/storage";
import { Card } from "@/shared/ui/Card";

const emailStatusLabel: Record<EmailLogRecord["status"], string> = {
  pending: "قيد الإرسال",
  sent: "أُرسل",
  failed: "فشل",
  skipped: "مكرر",
};

type NotificationRow = AppNotification & {
  listingHref?: string;
  listingTitle?: string;
  typeLabel?: string;
  userEmail?: string;
  userHref?: string;
  userName?: string;
};

type EmailRow = EmailLogRecord & {
  entityHref?: string;
  entityLabel?: string;
  typeLabel?: string;
  userHref?: string;
  userName?: string;
};

export function AdminNotificationsPanel() {
  const locale = useLocale();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailRow[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    emailsSent: 0,
    emailsFailed: 0,
    emailsPending: 0,
  });

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") return;
    adminFetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.notifications ?? []);
        setEmailLogs(data.emailLogs ?? []);
        if (data.summary) {
          setSummary({
            total: data.summary.total ?? 0,
            unread: data.summary.unread ?? 0,
            emailsSent: data.summary.emailsSent ?? 0,
            emailsFailed: data.summary.emailsFailed ?? 0,
            emailsPending: data.summary.emailsPending ?? 0,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="admin-desk grid gap-4">
      <div className="admin-desk-toolbar">
        <p className="text-sm text-muted">
          إشعارات المستخدمين وسجل البريد — راقب القراءة وحالة الإرسال من مكان
          واحد.
        </p>
      </div>

      <div className="admin-ops__kpi-grid">
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">كل الإشعارات</p>
          <p className="admin-ops__kpi-value">{summary.total}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">غير مقروء</p>
          <p className="admin-ops__kpi-value">{summary.unread}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">بريد أُرسل</p>
          <p className="admin-ops__kpi-value">{summary.emailsSent}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">بريد فشل</p>
          <p className="admin-ops__kpi-value">{summary.emailsFailed}</p>
        </div>
        <div className="admin-ops__kpi">
          <p className="admin-ops__kpi-label">بريد قيد الإرسال</p>
          <p className="admin-ops__kpi-value">{summary.emailsPending}</p>
        </div>
      </div>

      <h2 className="text-base font-black text-ink">الإشعارات الداخلية</h2>
      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>المستخدم</th>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={5}>
                    لا توجد إشعارات في النظام بعد.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const href = item.listingHref || item.href;
                  const title = humanDisplayLabel(item.title, "إشعار");
                  return (
                    <tr key={item.id}>
                      <td className="admin-desk-cell-wrap">
                        <p className="admin-desk-cell-title">
                          {href ? (
                            <Link
                              className="admin-ops__text-link hover:underline"
                              href={href}
                            >
                              {title}
                            </Link>
                          ) : (
                            title
                          )}
                        </p>
                        {item.body ? (
                          <p className="text-xs text-muted">
                            {humanDisplayLabel(item.body, "")}
                          </p>
                        ) : null}
                      </td>
                      <td className="text-sm">
                        {item.userHref ? (
                          <Link
                            className="admin-ops__text-link hover:underline"
                            href={item.userHref}
                          >
                            {humanDisplayLabel(item.userName, "مستخدم")}
                          </Link>
                        ) : (
                          humanDisplayLabel(item.userName, "مستخدم")
                        )}
                      </td>
                      <td>{item.typeLabel || notificationTypeLabel(item.type)}</td>
                      <td className="text-xs text-muted">
                        {new Date(item.createdAt).toLocaleString(intlLocale(locale))}
                      </td>
                      <td>
                        <span
                          className={`admin-ops__status-chip${
                            item.read ? "" : " admin-ops__status-chip--warn"
                          }`}
                        >
                          {item.read ? "مقروء" : "جديد"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <ul className="admin-desk-mobile-list">
          {items.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لا توجد إشعارات في النظام بعد.</p>
            </li>
          ) : (
            items.map((item) => {
              const href = item.listingHref || item.href;
              const title = humanDisplayLabel(item.title, "إشعار");
              return (
                <li key={item.id} className="admin-desk-mobile-card">
                  <div className="admin-desk-mobile-card__head">
                    <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                      {href ? (
                        <Link className="admin-ops__text-link hover:underline" href={href}>
                          {title}
                        </Link>
                      ) : (
                        title
                      )}
                    </p>
                    <span
                      className={`admin-ops__status-chip${
                        item.read ? "" : " admin-ops__status-chip--warn"
                      }`}
                    >
                      {item.read ? "مقروء" : "جديد"}
                    </span>
                  </div>
                  <div className="admin-desk-mobile-card__meta">
                    <span>{humanDisplayLabel(item.userName, "مستخدم")}</span>
                    <span>{item.typeLabel || notificationTypeLabel(item.type)}</span>
                    <span>
                      {new Date(item.createdAt).toLocaleString(intlLocale(locale))}
                    </span>
                  </div>
                  {item.body ? (
                    <p className="text-xs text-muted">
                      {humanDisplayLabel(item.body, "")}
                    </p>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </Card>

      <h2 className="text-base font-black text-ink">سجل البريد الإلكتروني</h2>
      <Card className="admin-desk-table-card overflow-hidden p-0" variant="flat">
        <div className="admin-desk-table-scroll">
          <table className="admin-ops__table admin-desk-table admin-desk-table--compact">
            <thead>
              <tr>
                <th>الموضوع</th>
                <th>إلى</th>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.length === 0 ? (
                <tr>
                  <td className="text-muted" colSpan={5}>
                    لم يُسجَّل إرسال بريد بعد.
                  </td>
                </tr>
              ) : (
                emailLogs.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-desk-cell-wrap">
                      <p className="admin-desk-cell-title">
                        {humanDisplayLabel(item.subject, "رسالة")}
                      </p>
                      {item.error ? (
                        <p className="text-xs text-muted">{item.error}</p>
                      ) : null}
                    </td>
                    <td className="text-xs" dir="ltr">
                      {item.to}
                    </td>
                    <td className="text-xs">
                      {item.entityHref && item.entityLabel ? (
                        <>
                          {item.typeLabel || emailEventTypeLabel(item.type)} ·{" "}
                          <Link
                            className="admin-ops__text-link hover:underline"
                            href={item.entityHref}
                          >
                            {item.entityLabel}
                          </Link>
                        </>
                      ) : (
                        item.typeLabel || emailEventTypeLabel(item.type)
                      )}
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(item.createdAt).toLocaleString(intlLocale(locale))}
                    </td>
                    <td>
                      <span
                        className={`admin-ops__status-chip${
                          item.status === "failed"
                            ? " admin-ops__status-chip--warn"
                            : ""
                        }`}
                      >
                        {emailStatusLabel[item.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="admin-desk-mobile-list">
          {emailLogs.length === 0 ? (
            <li className="admin-desk-mobile-card">
              <p className="text-sm text-muted">لم يُسجَّل إرسال بريد بعد.</p>
            </li>
          ) : (
            emailLogs.map((item) => (
              <li key={item.id} className="admin-desk-mobile-card">
                <div className="admin-desk-mobile-card__head">
                  <p className="min-w-0 flex-1 text-sm font-bold text-ink">
                    {humanDisplayLabel(item.subject, "رسالة")}
                  </p>
                  <span
                    className={`admin-ops__status-chip${
                      item.status === "failed"
                        ? " admin-ops__status-chip--warn"
                        : ""
                    }`}
                  >
                    {emailStatusLabel[item.status]}
                  </span>
                </div>
                <div className="admin-desk-mobile-card__meta">
                  <span dir="ltr">{item.to}</span>
                  <span>{item.typeLabel || emailEventTypeLabel(item.type)}</span>
                  {item.entityHref && item.entityLabel ? (
                    <span>
                      <Link
                        className="admin-ops__text-link hover:underline"
                        href={item.entityHref}
                      >
                        {item.entityLabel}
                      </Link>
                    </span>
                  ) : null}
                  <span>
                    {new Date(item.createdAt).toLocaleString(intlLocale(locale))}
                  </span>
                </div>
                {item.error ? (
                  <p className="text-xs text-muted">{item.error}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
