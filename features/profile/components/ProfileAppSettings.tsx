"use client";

import { LanguageSwitch } from "@/shared/i18n/LanguageSwitch";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocaleMessages } from "@/shared/i18n/useLocale";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { Card } from "@/shared/ui/Card";

/** Language + theme for signed-in users (replaces header/footer guest menu settings). */
export function ProfileAppSettings() {
  const copy = useLocaleMessages();

  return (
    <LocalizedTree>
      <Card className="mt-6 scroll-mt-24 p-5" id="app-settings" variant="flat">
        <h2 className="text-sm font-semibold text-ink">إعدادات التطبيق</h2>
        <p className="mt-1 text-xs leading-6 text-muted">
          اللغة والمظهر — نفس الخيارات التي كانت في قائمة الموبايل.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="rounded-[var(--radius-xl)] border border-border bg-surface-muted px-4 py-3">
            <p className="mb-2 text-xs font-bold text-muted">اللغة</p>
            <LanguageSwitch />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-border bg-surface-muted px-4 py-3">
            <span className="text-sm font-semibold text-ink">{copy.nightMode}</span>
            <ThemeToggle className="shrink-0" />
          </div>
        </div>
      </Card>
    </LocalizedTree>
  );
}
