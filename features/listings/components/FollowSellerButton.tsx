"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/services/storage";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { Button } from "@/shared/ui/Button";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

type FollowSellerButtonProps = {
  className?: string;
  sellerId: string;
};

export function FollowSellerButton({
  className,
  sellerId,
}: FollowSellerButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const user = getSessionUser();
    if (!user) {
      queueMicrotask(() => {
        if (!cancelled) setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }
    if (user.id === sellerId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setHidden(true);
          setLoaded(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    fetch(`/api/sellers/${encodeURIComponent(sellerId)}/follow`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : { following: false }))
      .then((data) => {
        if (!cancelled) setFollowing(Boolean(data.following));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (!loaded || hidden) return null;

  async function toggle() {
    const user = getSessionUser();
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(
          typeof window !== "undefined" ? window.location.pathname : "/",
        )}`,
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/sellers/${encodeURIComponent(sellerId)}/follow`,
        {
          method: following ? "DELETE" : "POST",
          credentials: "include",
        },
      );
      if (response.ok) {
        setFollowing(!following);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(STORAGE_EVENTS.followsChange));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <LocalizedTree>
      <Button
        className={className}
        loading={busy}
        onClick={() => void toggle()}
        size="sm"
        type="button"
        variant={following ? "secondary" : "primary"}
      >
        {following ? "إلغاء المتابعة" : "متابعة البائع"}
      </Button>
    </LocalizedTree>
  );
}
