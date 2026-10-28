"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { CategoryMark } from "@/shared/components/CategoryMark";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useTx } from "@/shared/i18n/useTx";
import type { DesktopCategoryNavItem } from "@/shared/navigation/desktop-category-nav";
import type { CategoryIconName } from "@/types";
import { Icon } from "@/shared/ui/Icon";
import "./desktop-category-menu.css";

const DESKTOP_MQ = "(min-width: 1024px)";
const CLOSE_DELAY_MS = 160;

type DesktopCategoryMenuProps = {
  categories: DesktopCategoryNavItem[];
};

function isCategoryPathActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
}

function useIsDesktopNav() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

/**
 * Horizontal category rail + hover/click dropdown for desktop (≥1024px) only.
 * Markup is CSS-hidden below 1024px; interaction listeners stay gated to desktop.
 */
export function DesktopCategoryMenu({ categories }: DesktopCategoryMenuProps) {
  if (categories.length === 0) return null;
  return <DesktopCategoryMenuInner categories={categories} />;
}

function DesktopCategoryMenuInner({
  categories,
}: {
  categories: DesktopCategoryNavItem[];
}) {
  const pathname = usePathname();
  const t = useTx();
  const isDesktop = useIsDesktopNav();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(categories.length);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpenId(null);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    if (!isDesktop) return;
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpenId(null);
      closeTimer.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer, isDesktop]);

  const openMenu = useCallback(
    (id: string) => {
      if (!isDesktop) return;
      clearCloseTimer();
      setOpenId(id);
    },
    [clearCloseTimer, isDesktop],
  );

  const onPathnameChange = useEffectEvent(() => {
    closeMenu();
  });

  useEffect(() => {
    onPathnameChange();
  }, [pathname]);

  useEffect(() => {
    if (!isDesktop) closeMenu();
  }, [isDesktop, closeMenu]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (!isDesktop || !openId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openId, closeMenu, isDesktop]);

  const recomputeVisible = useCallback(() => {
    if (!isDesktop) return;
    const rail = railRef.current;
    const measure = measureRef.current;
    if (!rail || !measure) return;

    const available = rail.clientWidth;
    const nodes = Array.from(
      measure.querySelectorAll<HTMLElement>("[data-nav-measure]"),
    );
    if (nodes.length === 0) {
      setVisibleCount(categories.length);
      return;
    }

    const moreWidth =
      measure.querySelector<HTMLElement>("[data-nav-more-measure]")
        ?.offsetWidth ?? 88;
    let used = 0;
    let fit = 0;
    for (let i = 0; i < nodes.length; i += 1) {
      const next = used + nodes[i].offsetWidth;
      const remaining = nodes.length - (i + 1);
      const needMore = remaining > 0;
      const limit = needMore ? available - moreWidth : available;
      if (next > limit) break;
      used = next;
      fit = i + 1;
    }
    setVisibleCount(Math.max(1, fit));
  }, [categories.length, isDesktop]);

  useLayoutEffect(() => {
    if (!isDesktop) return;
    recomputeVisible();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", recomputeVisible);
      return () => window.removeEventListener("resize", recomputeVisible);
    }
    const observer = new ResizeObserver(() => recomputeVisible());
    observer.observe(rail);
    return () => observer.disconnect();
  }, [recomputeVisible, categories, isDesktop]);

  const visible = categories.slice(0, visibleCount);
  const overflow = categories.slice(visibleCount);
  const openCategory =
    openId === "__more__"
      ? null
      : categories.find((item) => item.id === openId) ?? null;
  const isOpen = isDesktop && openId != null;

  useLayoutEffect(() => {
    if (!isDesktop || !openId || !shellRef.current) {
      setPanelStyle({});
      return;
    }
    const shell = shellRef.current;
    const trigger = shell.querySelector<HTMLElement>(
      `[data-nav-trigger="${openId}"]`,
    );
    const shellBox = shell.getBoundingClientRect();
    if (!trigger) {
      setPanelStyle({ insetInlineStart: "0px" });
      return;
    }
    const triggerBox = trigger.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";
    const rawStart = isRtl
      ? shellBox.right - triggerBox.right
      : triggerBox.left - shellBox.left;
    const maxStart = Math.max(0, shellBox.width - 288);
    const clamped = Math.min(Math.max(0, rawStart), maxStart);
    setPanelStyle({ insetInlineStart: `${clamped}px` });
  }, [openId, visibleCount, isDesktop]);

  return (
    <LocalizedTree>
      <>
        <div
          aria-hidden={!isOpen}
          className={`desktop-category-nav__overlay${isOpen ? " is-open" : ""}`}
          onClick={closeMenu}
        />

        <div className="desktop-category-nav" ref={rootRef}>
          <div className="app-container desktop-category-nav__shell" ref={shellRef}>
            <div
              aria-hidden
              className="desktop-category-nav__measure"
              ref={measureRef}
            >
              {categories.map((category) => (
                <span
                  className="desktop-category-nav__item"
                  data-nav-measure
                  key={`m-${category.id}`}
                >
                  <span className="desktop-category-nav__item-icon">
                    <CategoryMark
                      category={{
                        id: category.id,
                        icon: category.icon as CategoryIconName,
                        name: category.name,
                      }}
                      compact
                      iconSize={14}
                    />
                  </span>
                  <span className="desktop-category-nav__item-label">
                    {t(category.name)}
                  </span>
                </span>
              ))}
              <span
                className="desktop-category-nav__item"
                data-nav-more-measure
              >
                {t("المزيد")}
                <Icon name="chevron-left" size={12} />
              </span>
            </div>

            <nav
              aria-label={t("التصنيفات")}
              className="desktop-category-nav__rail"
              ref={railRef}
            >
              {visible.map((category) => {
                const active = isCategoryPathActive(pathname, category.href);
                const expanded = isOpen && openId === category.id;
                return (
                  <button
                    aria-controls={panelId}
                    aria-expanded={expanded}
                    aria-haspopup="true"
                    className={`desktop-category-nav__item${active ? " is-active" : ""}`}
                    data-nav-trigger={category.id}
                    key={category.id}
                    onClick={() =>
                      expanded ? closeMenu() : openMenu(category.id)
                    }
                    onFocus={() => openMenu(category.id)}
                    onMouseEnter={() => openMenu(category.id)}
                    onMouseLeave={scheduleClose}
                    type="button"
                  >
                    <span className="desktop-category-nav__item-icon">
                      <CategoryMark
                        category={{
                          id: category.id,
                          icon: category.icon as CategoryIconName,
                          name: category.name,
                        }}
                        compact
                        iconSize={14}
                      />
                    </span>
                    <span className="desktop-category-nav__item-label">
                      {t(category.name)}
                    </span>
                  </button>
                );
              })}

              {overflow.length > 0 ? (
                <div className="desktop-category-nav__more-wrap">
                  <button
                    aria-controls={panelId}
                    aria-expanded={openId === "__more__"}
                    aria-haspopup="true"
                    className={`desktop-category-nav__item${openId === "__more__" ? " is-active" : ""}`}
                    data-nav-trigger="__more__"
                    onClick={() =>
                      openId === "__more__" ? closeMenu() : openMenu("__more__")
                    }
                    onFocus={() => openMenu("__more__")}
                    onMouseEnter={() => openMenu("__more__")}
                    onMouseLeave={scheduleClose}
                    type="button"
                  >
                    <span className="desktop-category-nav__item-label">
                      {t("المزيد")}
                    </span>
                    <Icon name="chevron-left" size={12} />
                  </button>
                </div>
              ) : null}
            </nav>

            <div
              className={`desktop-category-nav__panel${isOpen ? " is-open" : ""}`}
              id={panelId}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
              role="region"
              style={panelStyle}
            >
              {openId === "__more__" ? (
                <div className="desktop-category-nav__panel-scroll">
                  <div className="desktop-category-nav__panel-head">
                    <p className="desktop-category-nav__panel-title">
                      {t("المزيد من التصنيفات")}
                    </p>
                    <Link
                      className="desktop-category-nav__panel-all"
                      href="/categories"
                      onClick={closeMenu}
                    >
                      {t("عرض الكل")}
                      <Icon name="arrow-left" size={12} />
                    </Link>
                  </div>
                  <div className="desktop-category-nav__more-list">
                    {overflow.map((category) => (
                      <Link
                        className="desktop-category-nav__link"
                        href={category.href}
                        key={category.id}
                        onClick={closeMenu}
                      >
                        {t(category.name)}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : openCategory ? (
                <div className="desktop-category-nav__panel-scroll">
                  <div className="desktop-category-nav__panel-head">
                    <p className="desktop-category-nav__panel-title">
                      {t(openCategory.name)}
                    </p>
                    <Link
                      className="desktop-category-nav__panel-all"
                      href={openCategory.href}
                      onClick={closeMenu}
                    >
                      {t("عرض الكل")}
                      <Icon name="arrow-left" size={12} />
                    </Link>
                  </div>
                  {openCategory.subcategories.length > 0 ? (
                    <div className="desktop-category-nav__grid">
                      {openCategory.subcategories.map((sub) => (
                        <Link
                          className="desktop-category-nav__link"
                          href={sub.href}
                          key={sub.href}
                          onClick={closeMenu}
                        >
                          {t(sub.name)}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="desktop-category-nav__empty">
                      {t("تصفح كل إعلانات هذا القسم")}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </>
    </LocalizedTree>
  );
}
