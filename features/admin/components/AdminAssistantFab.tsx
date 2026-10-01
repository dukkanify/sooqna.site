"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AdminAssistantPanel } from "@/features/admin/components/AdminAssistantPanel";
import { Icon } from "@/shared/ui/Icon";

export function AdminAssistantFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const onAssistantPage = pathname === "/admin/assistant";

  useEffect(() => {
    if (onAssistantPage) setOpen(false);
  }, [onAssistantPage]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (onAssistantPage) return null;

  return (
    <div className="admin-assistant-fab">
      {open ? (
        <div
          aria-labelledby={`${panelId}-title`}
          className="admin-assistant-fab__panel"
          id={panelId}
          role="dialog"
        >
          <div className="admin-assistant-fab__head">
            <div>
              <p className="admin-assistant-fab__eyebrow">مساعد التعلّم</p>
              <h2 className="admin-assistant-fab__title" id={`${panelId}-title`}>
                اسأل عن أي قسم في اللوحة
              </h2>
            </div>
            <div className="admin-assistant-fab__head-actions">
              <Link
                className="admin-assistant-fab__expand"
                href="/admin/assistant"
                onClick={() => setOpen(false)}
              >
                فتح الصفحة
              </Link>
              <button
                aria-label="إغلاق المساعد"
                className="admin-assistant-fab__close"
                onClick={() => setOpen(false)}
                type="button"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
          <AdminAssistantPanel compact />
        </div>
      ) : null}

      <button
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="admin-assistant-fab__button"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Icon name="star" size={18} />
        <span>{open ? "إغلاق" : "مساعد التعلّم"}</span>
      </button>
    </div>
  );
}
