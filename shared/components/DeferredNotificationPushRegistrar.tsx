"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const NotificationPushRegistrar = dynamic(
  () =>
    import("@/features/notifications/NotificationPushRegistrar").then(
      (mod) => mod.NotificationPushRegistrar,
    ),
  { ssr: false },
);

function scheduleIdle(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const ric = window.requestIdleCallback?.bind(window);
  if (ric) {
    const id = ric(callback, { timeout: 4000 });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = globalThis.setTimeout(callback, 2000);
  return () => globalThis.clearTimeout(id);
}

/** Registers SW / push after idle so first paint stays clear. */
export function DeferredNotificationPushRegistrar() {
  const [ready, setReady] = useState(false);

  useEffect(() => scheduleIdle(() => setReady(true)), []);

  if (!ready) return null;
  return <NotificationPushRegistrar />;
}
