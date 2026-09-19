"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { UserProfile } from "@/types";
import type { AdminPermission } from "@/types/domain/user";
import { LanguageSwitch } from "@/shared/i18n/LanguageSwitch";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { tx } from "@/shared/i18n/tx";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import type { IconName } from "@/shared/ui/Icon";
import { BRAND } from "@/shared/constants/brand";
import { hasAdminPermission } from "@/services/auth/admin-permission-checks";
import { clearSessionUser, getSessionUser } from "@/services/storage";
import { removeSessionCookie } from "@/services/auth/session-sync";
import "./admin-ops.css";

export type AdminPath =
  | "/admin"
  | "/admin/activities"
  | "/admin/analytics"
  | "/admin/reports"
  | "/admin/users"
  | "/admin/listings"
  | "/admin/disputes"
  | "/admin/categories"
  | "/admin/locations"
  | "/admin/orders"
  | "/admin/escrow"
  | "/admin/wallets"
  | "/admin/stripe"
  | "/admin/favorites"
  | "/admin/notifications"
  | "/admin/addresses"
  | "/admin/job-applications"
  | "/admin/viewing-bookings"
  | "/admin/quote-requests"
  | "/admin/listing-reports"
  | "/admin/settings"
  | "/admin/audit";

type AdminShellProps = {
  activePath: AdminPath;
  children: ReactNode;
  description: string;
  title: string;
};

type NavGroup = "primary" | "more";

const adminLinks: {
  href: AdminPath;
  icon: IconName;
  label: string;
  group: NavGroup;
  keywords: string;
  permission?: AdminPermission;
}[] = [
  {
    href: "/admin",
    icon: "home",
    label: "الرئيسية",
    group: "primary",
    keywords: "لوحة رئيسية dashboard غرفة التحكم",
  },
  {
    href: "/admin/listings",
    icon: "grid",
    label: "الإعلانات",
    group: "primary",
    keywords: "مراجعة اعتماد إضافة نشر إعلان",
    permission: "listings",
  },
  {
    href: "/admin/users",
    icon: "user",
    label: "المستخدمون",
    group: "primary",
    keywords: "حسابات تعليق تحقق",
    permission: "users",
  },
  {
    href: "/admin/disputes",
    icon: "message",
    label: "النزاعات",
    group: "primary",
    keywords: "خلاف حكم",
    permission: "disputes",
  },
  {
    href: "/admin/orders",
    icon: "package",
    label: "الطلبات",
    group: "primary",
    keywords: "استرداد checkout",
    permission: "orders",
  },
  {
    href: "/admin/escrow",
    icon: "shield",
    label: "الضمان",
    group: "primary",
    keywords: "حجز escrow",
    permission: "payments",
  },
  {
    href: "/admin/categories",
    icon: "briefcase",
    label: "التصنيفات",
    group: "primary",
    keywords: "فئات نماذج سيارات كتالوج",
    permission: "categories",
  },
  {
    href: "/admin/settings",
    icon: "filter",
    label: "الإعدادات",
    group: "primary",
    keywords: "رسوم صيانة stripe url إعدادات الموقع",
    permission: "settings",
  },
  {
    href: "/admin/analytics",
    icon: "chart",
    label: "التحليلات",
    group: "more",
    keywords: "إحصائيات charts trends",
    permission: "reports",
  },
  {
    href: "/admin/reports",
    icon: "wallet",
    label: "التقارير",
    group: "more",
    keywords: "مالية fees volume",
    permission: "reports",
  },
  {
    href: "/admin/locations",
    icon: "map",
    label: "المدن",
    group: "more",
    keywords: "مدن مواقع emirates المواقع",
    permission: "categories",
  },
  {
    href: "/admin/wallets",
    icon: "wallet",
    label: "المحافظ",
    group: "more",
    keywords: "أرصدة",
    permission: "payments",
  },
  {
    href: "/admin/stripe",
    icon: "star",
    label: "Stripe",
    group: "more",
    keywords: "دفع بوابة webhook payments",
    permission: "payments",
  },
  {
    href: "/admin/favorites",
    icon: "heart",
    label: "المفضلة",
    group: "more",
    keywords: "favorites اهتمام",
    permission: "listings",
  },
  {
    href: "/admin/notifications",
    icon: "bell",
    label: "الإشعارات",
    group: "more",
    keywords: "تنبيهات notifications",
    permission: "listings",
  },
  {
    href: "/admin/addresses",
    icon: "map",
    label: "العناوين",
    group: "more",
    keywords: "توصيل addresses",
    permission: "orders",
  },
  {
    href: "/admin/activities",
    icon: "clock",
    label: "الأنشطة",
    group: "more",
    keywords: "activity requests leads jobs bookings quotes إدارة الأنشطة",
  },
  {
    href: "/admin/job-applications",
    icon: "briefcase",
    label: "التوظيف",
    group: "more",
    keywords: "وظائف",
    permission: "listings",
  },
  {
    href: "/admin/viewing-bookings",
    icon: "home",
    label: "المعاينات",
    group: "more",
    keywords: "عقارات",
    permission: "listings",
  },
  {
    href: "/admin/quote-requests",
    icon: "wrench",
    label: "عروض الأسعار",
    group: "more",
    keywords: "خدمات",
    permission: "listings",
  },
  {
    href: "/admin/listing-reports",
    icon: "shield",
    label: "بلاغات الإعلانات",
    group: "more",
    keywords: "بلاغ إبلاغ report guest",
    permission: "listings",
  },
  {
    href: "/admin/audit",
    icon: "clock",
    label: "سجل العمليات",
    group: "more",
    keywords: "audit log تاريخ",
    permission: "settings",
  },
];

export function AdminShell({
  activePath,
  children,
  description,
  title,
}: AdminShellProps) {
  const [authState, setAuthState] = useState<
    "loading" | "guest" | "user" | "admin"
  >("loading");
  const [displayUser, setDisplayUser] = useState<UserProfile | null>(null);
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      router.replace(`/login?next=${encodeURIComponent(activePath)}`);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDisplayUser(sessionUser);
      setAuthState("admin");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname, activePath, router]);

  const filteredLinks = useMemo(() => {
    const permitted = adminLinks.filter(
      (link) =>
        !link.permission || hasAdminPermission(displayUser, link.permission),
    );
    const q = query.trim().toLowerCase();
    if (!q) return permitted;
    return permitted.filter(
      (link) =>
        link.label.includes(query.trim()) ||
        tx("en", link.label).toLowerCase().includes(q) ||
        link.keywords.toLowerCase().includes(q) ||
        link.href.includes(q),
    );
  }, [query, displayUser]);

  const primaryLinks = useMemo(
    () => filteredLinks.filter((link) => link.group === "primary"),
    [filteredLinks],
  );
  const moreLinks = useMemo(
    () => filteredLinks.filter((link) => link.group === "more"),
    [filteredLinks],
  );
  const searching = query.trim().length > 0;
  const activeInMore = moreLinks.some((link) => link.href === activePath);
  const showMore = searching || moreOpen || activeInMore;

  const mobileLinks = searching
    ? filteredLinks
    : [...primaryLinks, ...(showMore ? moreLinks : [])];

  function renderNavLink(link: (typeof adminLinks)[number]) {
    const active = link.href === activePath;
    return (
      <Link
        key={link.href}
        className={`admin-ops__nav-link${
          active ? " admin-ops__nav-link--active" : ""
        }`}
        href={link.href}
      >
        <Icon name={link.icon} size={16} />
        <span>{link.label}</span>
      </Link>
    );
  }

  async function handleLogout() {
    clearSessionUser();
    await removeSessionCookie();
    router.push("/login?next=/admin");
  }

  if (authState !== "admin") {
    return (
      <LocalizedTree>
      <section className="app-container page-padding">
        <Card className="p-8 text-center" variant="flat">
          <p className="text-sm font-medium text-muted">
            جاري توجيهك لتسجيل الدخول...
          </p>
        </Card>
      </section>
      </LocalizedTree>
    );
  }

  return (
    <LocalizedTree>
    <div className="admin-ops">
      <div className="admin-ops__shell">
        <aside className="admin-ops__sidebar" aria-label="تنقل الإدارة">
          <div className="admin-ops__sidebar-brand">
            <Image
              alt={BRAND.nameAr}
              className="admin-ops__mark"
              height={36}
              priority
              src="/brand/logo-icon.svg"
              unoptimized
              width={36}
            />
            <div className="admin-ops__brand-copy">
              <p className="admin-ops__brand-name">{BRAND.nameAr}</p>
              <p className="admin-ops__brand-sub">لوحة التحكم</p>
            </div>
          </div>
          <label className="admin-ops__search">
            <Icon name="search" size={14} />
            <input
              aria-label="بحث في أقسام اللوحة"
              placeholder="بحث سريع…"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <nav className="admin-ops__nav">
            <div className="admin-ops__nav-group">
              <p className="admin-ops__nav-group-label">اليومي</p>
              {primaryLinks.map(renderNavLink)}
            </div>
            {moreLinks.length > 0 ? (
              <div className="admin-ops__nav-group">
                <button
                  aria-expanded={showMore}
                  className="admin-ops__nav-more-toggle"
                  onClick={() => setMoreOpen((open) => !open)}
                  type="button"
                >
                  <span>المزيد</span>
                  <span aria-hidden>{showMore ? "▾" : "▸"}</span>
                </button>
                {showMore ? moreLinks.map(renderNavLink) : null}
              </div>
            ) : null}
          </nav>
          <div className="admin-ops__sidebar-footer">
            <Link className="admin-ops__back" href="/">
              العودة إلى السوق
            </Link>
            <Button
              onClick={handleLogout}
              size="sm"
              type="button"
              variant="secondary"
            >
              تسجيل الخروج
            </Button>
          </div>
        </aside>

        <div className="admin-ops__workspace">
          <header className="admin-ops__topbar">
            <div className="admin-ops__brand">
              <Image
                alt={BRAND.nameAr}
                className="admin-ops__mark"
                height={36}
                src="/brand/logo-icon.svg"
                unoptimized
                width={36}
              />
              <div className="admin-ops__brand-copy">
                <p className="admin-ops__brand-name">{BRAND.nameAr}</p>
                <p className="admin-ops__brand-sub">لوحة التحكم</p>
              </div>
            </div>
            <div className="admin-ops__top-actions">
              <LanguageSwitch variant="compact" />
              <div className="admin-ops__who">
                <p className="admin-ops__who-name">
                  {displayUser?.fullName ?? "Admin"}
                </p>
                <p className="admin-ops__who-role">مدير</p>
              </div>
              <Button
                className="admin-ops__logout-btn"
                onClick={handleLogout}
                size="sm"
                type="button"
                variant="secondary"
              >
                خروج
              </Button>
            </div>
          </header>

          <div className="admin-ops__mobile-nav" aria-label="تنقل سريع">
            {mobileLinks.map((link) => {
              const active = link.href === activePath;
              return (
                <Link
                  key={link.href}
                  className={`admin-ops__pill${active ? " admin-ops__pill--active" : ""}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
            {!searching && !showMore && moreLinks.length > 0 ? (
              <button
                className="admin-ops__pill"
                onClick={() => setMoreOpen(true)}
                type="button"
              >
                المزيد
              </button>
            ) : null}
          </div>

          <div className="admin-ops__pagehead">
            <div>
              <h1 className="admin-ops__title">{title}</h1>
              {description ? (
                <p className="admin-ops__desc">{description}</p>
              ) : null}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
    </LocalizedTree>
  );
}
