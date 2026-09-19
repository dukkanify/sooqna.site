"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getUnreadChatCount } from "@/services/chat";
import { getSessionSnapshot, subscribeSession } from "@/services/storage/external-store";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocaleMessages } from "@/shared/i18n/useLocale";
import { MobileGuestMenuDrawer } from "./MobileGuestMenuDrawer";

const items = [
  { href: "/", icon: "home" as const, label: "الرئيسية" },
  {
    favorites: true,
    href: "/profile#favorites",
    icon: "heart" as const,
    label: "المفضلة",
  },
  { fab: true, href: "/listings/new", icon: "plus" as const, label: "أضف إعلان" },
  { href: "/chat", icon: "message" as const, label: "الرسائل" },
  { account: true, href: "/profile", icon: "user" as const, label: "الحساب" },
];

function scrollProfileHashIntoView() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return;
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function readUnreadCount(userId?: string) {
  return getUnreadChatCount(userId);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const copy = useLocaleMessages();
  const user = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const [hash, setHash] = useState("");
  const [unreadChat, setUnreadChat] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const syncUnread = () => {
      setUnreadChat(readUnreadCount(user?.id));
    };
    const syncFromServer = () => {
      if (!user?.id) {
        setUnreadChat(0);
        return;
      }
      void import("@/services/chat").then(({ syncChatConversationsFromServer }) =>
        syncChatConversationsFromServer()
          .then(() => {
            if (!cancelled) syncUnread();
          })
          .catch(() => {
            if (!cancelled) syncUnread();
          }),
      );
    };
    syncFromServer();
    window.addEventListener(STORAGE_EVENTS.chatChange, syncUnread);
    window.addEventListener(STORAGE_EVENTS.sessionChange, syncFromServer);
    const timer = window.setInterval(syncFromServer, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener(STORAGE_EVENTS.chatChange, syncUnread);
      window.removeEventListener(STORAGE_EVENTS.sessionChange, syncFromServer);
      window.clearInterval(timer);
    };
  }, [user?.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <LocalizedTree>
      <>
        <MobileGuestMenuDrawer open={menuOpen && !user} onClose={() => setMenuOpen(false)} />
        <nav
          aria-label="التنقل السفلي"
          className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] lg:hidden"
        >
          <div className="mobile-bottom-nav__inner">
            <div className="mobile-bottom-nav__grid">
              {items.map((item) => {
                const isFavorites = "favorites" in item && item.favorites;
                const isAccount = "account" in item && item.account;
                const isChat = item.href === "/chat";
                const badge = isChat && unreadChat > 0 ? unreadChat : 0;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : isFavorites
                      ? pathname === "/profile" && hash === "#favorites"
                      : isAccount
                        ? user
                          ? pathname === "/profile" && hash !== "#favorites"
                          : menuOpen
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                if ("fab" in item && item.fab) {
                  return (
                    <div key={item.label} className="mobile-bottom-nav__fab-slot">
                      <Link
                        aria-label={item.label}
                        className="mobile-bottom-nav__fab"
                        href={item.href}
                      >
                        <Icon name={item.icon} size={20} />
                      </Link>
                      <span className="mobile-bottom-nav__fab-label">{item.label}</span>
                    </div>
                  );
                }

                if (isAccount && !user) {
                  return (
                    <button
                      key="guest-menu"
                      aria-expanded={menuOpen}
                      aria-label={menuOpen ? copy.closeMenu : copy.menu}
                      className={`mobile-bottom-nav__link ${
                        isActive ? "mobile-bottom-nav__link--active" : ""
                      }`}
                      onClick={() => setMenuOpen((open) => !open)}
                      type="button"
                    >
                      <span
                        className={`mobile-bottom-nav__icon-wrap${
                          isActive ? " mobile-bottom-nav__icon-wrap--active" : ""
                        }`}
                      >
                        <Icon name={menuOpen ? "close" : "menu"} size={20} />
                      </span>
                      <span className="mobile-bottom-nav__label">{copy.menu}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    aria-label={
                      isChat && badge > 0
                        ? `${item.label}، ${badge} غير مقروء`
                        : item.label
                    }
                    className={`mobile-bottom-nav__link ${
                      isActive ? "mobile-bottom-nav__link--active" : ""
                    }`}
                    href={item.href}
                    onClick={() => {
                      if (!item.href.includes("#")) return;
                      window.setTimeout(scrollProfileHashIntoView, 0);
                      window.setTimeout(scrollProfileHashIntoView, 120);
                    }}
                  >
                    <span
                      className={`mobile-bottom-nav__icon-wrap${
                        isActive ? " mobile-bottom-nav__icon-wrap--active" : ""
                      }`}
                    >
                      <Icon
                        filled={item.icon === "heart" && isActive}
                        name={item.icon}
                        size={item.icon === "heart" ? 21 : 20}
                      />
                      {badge > 0 ? (
                        <span className="mobile-bottom-nav__badge">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mobile-bottom-nav__label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </>
    </LocalizedTree>
  );
}
