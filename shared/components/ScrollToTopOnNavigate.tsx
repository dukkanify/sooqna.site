"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function ScrollToTopEffect() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Always open navigated pages from the top so content starts at the beginning.
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, search]);

  return null;
}

/** Resets window scroll on App Router navigations (pathname / query changes). */
export function ScrollToTopOnNavigate() {
  return (
    <Suspense fallback={null}>
      <ScrollToTopEffect />
    </Suspense>
  );
}
