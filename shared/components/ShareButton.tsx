"use client";

import { useCallback, useMemo, useState } from "react";
import type { Listing } from "@/types";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { useToast } from "@/shared/components/ToastProvider";
import { getListingCanonicalUrl } from "@/shared/listings/listing-url";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

type ShareButtonProps = {
  className?: string;
  iconOnly?: boolean;
  listing: Listing;
  /**
   * - `ghost` (default): soft meta action for toolbars
   * - `panel`: full-width side-panel / sticky action
   * - `chip`: legacy bordered pill (avoid for new UI)
   */
  variant?: "ghost" | "panel" | "chip";
};

/** Soft meta action — default across the app. */
const ghostClass =
  "focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[var(--radius-xl)] px-3 text-xs font-semibold text-muted transition hover:bg-secondary-soft/60 hover:text-primary";

/** Full-width panel action next to favorite / CTA rows. */
const panelClass =
  "focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border/70 bg-surface px-4 text-sm font-semibold text-ink transition hover:border-secondary/40 hover:bg-secondary-soft/50";

const chipClass =
  "focus-ring interactive-lift inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border bg-surface px-4 text-sm font-semibold text-ink transition";

const iconOnlyClass =
  "focus-ring interactive-lift inline-flex items-center justify-center rounded-full border transition";

function labeledClass(variant: NonNullable<ShareButtonProps["variant"]>): string {
  if (variant === "panel") return panelClass;
  if (variant === "chip") return chipClass;
  return ghostClass;
}

export function ShareButton({
  className = "",
  iconOnly = false,
  listing,
  variant = "ghost",
}: ShareButtonProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const locationLabel = useMemo(
    () =>
      listing.area
        ? `${listing.area}، ${listing.emirate ?? listing.city}`
        : listing.emirate
          ? `${listing.city}، ${listing.emirate}`
          : listing.city,
    [listing.area, listing.city, listing.emirate],
  );

  const shareUrl = useMemo(() => getListingCanonicalUrl(listing), [listing]);

  const sharePayload = useMemo(
    () => ({
      title: listing.title,
      text: `${listing.title} — ${locationLabel}`,
      url: shareUrl,
    }),
    [listing.title, locationLabel, shareUrl],
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("تم نسخ رابط الإعلان");
      setModalOpen(false);
    } catch {
      showToast("تعذر نسخ الرابط", "error");
    }
  }, [shareUrl, showToast]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }
      setModalOpen(true);
    } catch {
      setModalOpen(true);
    }
  }, [sharePayload]);

  const shellClass = iconOnly
    ? `${iconOnlyClass} ${className}`
    : `${labeledClass(variant)} ${className}`;

  return (
    <LocalizedTree>
    <>
      <button
        aria-label="مشاركة الإعلان"
        className={shellClass}
        onClick={handleShare}
        title="مشاركة"
        type="button"
      >
        <Icon name="share" size={iconOnly ? 15 : 16} />
        {!iconOnly ? "مشاركة" : null}
      </button>

      {modalOpen ? (
        <div
          aria-labelledby="share-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-full bg-secondary-soft text-primary">
                  <Icon name="share" size={18} />
                </span>
                <h2 className="text-base font-black text-ink" id="share-dialog-title">
                  مشاركة الإعلان
                </h2>
              </div>
              <button
                aria-label="إغلاق"
                className="focus-ring rounded-full p-1 text-muted hover:bg-surface-muted"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-semibold text-ink" data-ugc>
              {listing.title}
            </p>
            <p className="mt-1 text-xs text-muted">{locationLabel}</p>
            <p className="mt-1.5">
              <CurrencyAmount amount={listing.price} size="sm" />
            </p>
            <div className="mt-4 grid gap-2">
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white"
                href={`https://wa.me/?text=${encodeURIComponent(`${sharePayload.text}\n${shareUrl}`)}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon className="shrink-0" name="whatsapp" size={18} />
                مشاركة عبر واتساب
              </a>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-muted"
                onClick={copyLink}
                type="button"
              >
                <Icon className="shrink-0 text-muted" name="share" size={16} />
                نسخ الرابط
              </button>
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-muted px-4 text-sm font-semibold text-ink"
                href={`mailto:?subject=${encodeURIComponent(listing.title)}&body=${encodeURIComponent(`${sharePayload.text}\n${shareUrl}`)}`}
              >
                <Icon className="shrink-0 text-muted" name="mail" size={16} />
                البريد الإلكتروني
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
    </LocalizedTree>
  );
}
