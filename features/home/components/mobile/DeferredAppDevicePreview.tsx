"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types";

const MobileAppDevicePreview = dynamic(
  () =>
    import("@/features/home/components/mobile/MobileAppDevicePreview").then(
      (mod) => mod.MobileAppDevicePreview,
    ),
  {
    loading: () => (
      <div
        aria-hidden
        className="h-full w-full animate-pulse bg-gradient-to-b from-[#152033] to-[#0b1628]"
      />
    ),
    ssr: false,
  },
);

type DeferredAppDevicePreviewProps = {
  listings: Listing[];
};

/** Heavy phone mock — load after first paint so it never competes with LCP. */
export function DeferredAppDevicePreview({
  listings,
}: DeferredAppDevicePreviewProps) {
  return <MobileAppDevicePreview listings={listings} />;
}
