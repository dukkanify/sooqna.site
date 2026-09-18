"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "@/shared/constants/navigation";
import { LanguageSwitch } from "@/shared/i18n/LanguageSwitch";
import { useLocaleMessages } from "@/shared/i18n/useLocale";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { Icon } from "@/shared/ui/Icon";

const drawerIcons: Record<string, "home" | "grid" | "star" | "search"> = {
  "/": "home",
  "/categories": "grid",
  "/featured": "star",
  "/search": "search",
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type MobileGuestMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/** Guest-only browse/settings drawer opened from the bottom-nav menu slot. */
export function MobileGuestMenuDrawer({
  open,
  onClose,
}: MobileGuestMenuDrawerProps) {
  const pathname = usePathname();
  const copy = useLocaleMessages();

  if (!open) return null;

  return (
    <div className="mobile-guest-menu" role="dialog" aria-label={copy.menu}>
      <button
        aria-label={copy.closeMenu}
        className="mobile-guest-menu__backdrop"
        onClick={onClose}
        type="button"
      />
      <nav className="mobile-guest-menu__panel">
        <div className="mobile-guest-menu__head">
          <p className="mobile-guest-menu__title">{copy.menu}</p>
          <button
            aria-label={copy.closeMenu}
            className="mobile-guest-menu__close"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <Link
          className="mobile-guest-menu__profile"
          href="/login"
          onClick={onClose}
        >
          <span className="mobile-guest-menu__profile-icon">
            <Icon name="user" size={18} />
          </span>
          <span className="mobile-guest-menu__profile-copy">
            <span className="mobile-guest-menu__profile-eyebrow">{copy.account}</span>
            <span className="mobile-guest-menu__profile-name">
              {copy.signInToContinue}
            </span>
          </span>
          <span className="mobile-guest-menu__profile-action">
            {copy.loginShort}
            <Icon name="chevron-left" size={14} />
          </span>
        </Link>

        <Link
          className="mobile-guest-menu__register"
          href="/register"
          onClick={onClose}
        >
          {copy.noAccount} <span>{copy.createAccount}</span>
        </Link>

        {primaryNavigation.map((item) => {
          const active = isActivePath(pathname, item.href);
          const icon = drawerIcons[item.href] ?? "grid";
          const labels: Record<string, string> = {
            "/": copy.home,
            "/categories": copy.categories,
          };
          return (
            <Link
              key={item.href}
              className={`mobile-guest-menu__link${
                active ? " mobile-guest-menu__link--active" : ""
              }`}
              href={item.href}
              onClick={onClose}
            >
              <span className="mobile-guest-menu__link-icon">
                <Icon name={icon} size={16} />
              </span>
              <span>{labels[item.href] ?? item.label}</span>
            </Link>
          );
        })}

        <LanguageSwitch className="mobile-guest-menu__language" />
        <div className="mobile-guest-menu__theme">
          <span>{copy.nightMode}</span>
          <ThemeToggle className="shrink-0" />
        </div>

        <Link
          className="mobile-guest-menu__cta"
          href="/listings/new"
          onClick={onClose}
        >
          <Icon name="plus" size={16} />
          {copy.addListing}
        </Link>
      </nav>
    </div>
  );
}
