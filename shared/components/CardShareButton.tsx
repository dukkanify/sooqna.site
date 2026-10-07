"use client";

import { useState } from "react";
import { Icon } from "@/shared/ui/Icon";
import { useTx } from "@/shared/i18n/useTx";

type CardShareButtonProps = {
  ariaLabel?: string;
  className?: string;
  /** `media` = glass chip on photos; `ghost` = quiet icon in card body. */
  tone?: "media" | "ghost";
  title: string;
  url: string;
};

function resolveShareUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

export function CardShareButton({
  ariaLabel = "مشاركة الإعلان",
  className = "",
  tone = "media",
  title,
  url,
}: CardShareButtonProps) {
  const t = useTx();
  const [shared, setShared] = useState(false);
  const label = t(ariaLabel);
  const toneClass =
    tone === "ghost"
      ? "focus-ring grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface-muted hover:text-ink"
      : "card-media-action focus-ring grid size-7 place-items-center rounded-full transition";

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = resolveShareUrl(url);

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        setShared(true);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
    } catch {
      setShared(false);
    }

    window.setTimeout(() => setShared(false), 2000);
  }

  return (
    <button
      aria-label={label}
      className={`${toneClass} ${className}`.trim()}
      onClick={handleClick}
      title={label}
      type="button"
    >
      <Icon name="share" size={13} />
      <span className="sr-only">{shared ? t("تمت المشاركة") : label}</span>
    </button>
  );
}
