"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getVerifyAccountPrompt } from "@/services/auth/account-access";
import { getSessionSnapshot, subscribeSession } from "@/services/storage/external-store";
import { Icon } from "@/shared/ui/Icon";
import "@/features/navigation/desktop/desktop-storefront-header.css";
import "./verify-account-banner.css";

const DISMISS_KEY = "sooqna_verify_banner_dismissed";

export function VerifyAccountBanner() {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const user = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const [dismissed, setDismissed] = useState(false);
  const prompt = hydrated ? getVerifyAccountPrompt(user, pathname) : null;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  if (!prompt || dismissed) return null;

  return (
    <div className="verify-account-banner" role="status">
      <div className="verify-account-banner__inner app-container">
        <div className="verify-account-banner__copy">
          <span className="verify-account-banner__mark" aria-hidden>
            <Icon name="shield" size={14} />
          </span>
          <p className="verify-account-banner__message">
            <span className="verify-account-banner__kicker">ثقة سوقنا</span>
            <span className="verify-account-banner__message--full">{prompt.message}</span>
            <span className="verify-account-banner__message--short">{prompt.shortMessage}</span>
          </p>
        </div>
        <Link className="verify-account-banner__action" href={prompt.href}>
          {prompt.actionLabel}
        </Link>
        <button
          aria-label="إغلاق"
          className="verify-account-banner__dismiss"
          onClick={dismiss}
          type="button"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}
