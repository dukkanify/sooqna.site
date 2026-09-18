"use client";

import Link from "next/link";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { EmirateLocationSelect } from "@/shared/components/EmirateLocationSelect";
import { VerifyAccountBanner } from "@/features/auth/components/VerifyAccountBanner";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocaleMessages } from "@/shared/i18n/useLocale";
import { Icon } from "@/shared/ui/Icon";

/**
 * Mobile home chrome. Menu (guest) lives in the bottom nav; signed-in
 * preferences live under /profile#app-settings.
 */
export function MobileHomeHeader() {
  const copy = useLocaleMessages();

  return (
    <LocalizedTree>
      <header className="mobile-home-header">
        <VerifyAccountBanner />
        <div className="mobile-home-header__bar">
          <div className="mobile-home-header__side mobile-home-header__side--start">
            <span className="mobile-home-header__side-spacer" aria-hidden />
          </div>

          <div className="mobile-home-header__brand">
            <BrandLogo href="/" showTagline={false} size="sm" />
          </div>

          <div className="mobile-home-header__side mobile-home-header__side--end">
            <div className="mobile-home-header__cluster">
              <Link
                aria-label={copy.search}
                className="mobile-home-header__icon-btn"
                href="/search"
              >
                <Icon name="search" size={17} />
              </Link>
              <NotificationBell />
            </div>
          </div>
        </div>

        <div className="mobile-home-header__smart-row">
          <EmirateLocationSelect variant="mobile" />
          <Link className="mobile-home-header__quick-search" href="/search">
            <Icon name="search" size={14} />
            <span>{copy.searchPlaceholder}</span>
          </Link>
        </div>
      </header>
    </LocalizedTree>
  );
}
