"use client";

import { BrandLogo } from "@/shared/components/BrandLogo";
import { EmirateLocationSelect } from "@/shared/components/EmirateLocationSelect";
import { VerifyAccountBanner } from "@/features/auth/components/VerifyAccountBanner";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

/**
 * Mobile home chrome — matches compact bar: city | logo | notifications.
 * Guest menu lives in the bottom nav; signed-in prefs under /profile#app-settings.
 * Header search row removed (search stays in hero / bottom search entry points).
 */
export function MobileHomeHeader() {
  return (
    <LocalizedTree>
      <header className="mobile-home-header">
        <VerifyAccountBanner />
        <div className="mobile-home-header__bar">
          <div className="mobile-home-header__side mobile-home-header__side--start">
            <EmirateLocationSelect
              className="mobile-home-header__location--bar"
              variant="mobile"
            />
          </div>

          <div className="mobile-home-header__brand">
            <BrandLogo href="/" showTagline={false} size="sm" />
          </div>

          <div className="mobile-home-header__side mobile-home-header__side--end">
            <NotificationBell />
          </div>
        </div>
      </header>
    </LocalizedTree>
  );
}
