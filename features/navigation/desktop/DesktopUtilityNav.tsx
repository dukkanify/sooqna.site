"use client";

import Link from "next/link";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { useTx } from "@/shared/i18n/useTx";
import { Icon, type IconName } from "@/shared/ui/Icon";
import "./desktop-storefront-header.css";

type UtilityItem = {
  href: string;
  icon: IconName;
  label: string;
  /** When true, render NotificationBell instead of a plain link. */
  notify?: boolean;
};

/**
 * Dubizzle-style icon + caption utility row for desktop headers (≥1024px).
 * Every href maps to an existing Sooqna route — no fake destinations.
 */
export function DesktopUtilityNav() {
  const t = useTx();

  const items: UtilityItem[] = [
    {
      href: "/notifications",
      icon: "bell",
      label: t("إشعارات"),
      notify: true,
    },
    {
      href: "/profile#saved-searches",
      icon: "search",
      label: t("البحوث المحفوظة"),
    },
    {
      href: "/profile#favorites",
      icon: "heart",
      label: t("مفضلتي"),
    },
    {
      href: "/chat",
      icon: "message",
      label: t("الرسائل"),
    },
    {
      href: "/dashboard/listings",
      icon: "grid",
      label: t("إعلاناتي"),
    },
  ];

  return (
    <nav aria-label={t("اختصارات الحساب")} className="desktop-utility-nav">
      {items.map((item) =>
        item.notify ? (
          <div className="desktop-utility-nav__item" key={item.href}>
            <NotificationBell
              badgeClassName="desktop-utility-nav__badge"
              className="desktop-utility-nav__bell"
              iconClassName="desktop-utility-nav__bell-icon"
              iconSize={20}
            />
            <span className="desktop-utility-nav__label">{item.label}</span>
          </div>
        ) : (
          <Link className="desktop-utility-nav__item" href={item.href} key={item.href}>
            <span className="desktop-utility-nav__icon" aria-hidden>
              <Icon name={item.icon} size={20} />
            </span>
            <span className="desktop-utility-nav__label">{item.label}</span>
          </Link>
        ),
      )}
    </nav>
  );
}
