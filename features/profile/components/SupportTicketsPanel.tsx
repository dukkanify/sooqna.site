"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SupportTicketReceipt } from "@/types/domain/support-message";
import { SUPPORT_TOPIC_LABELS } from "@/types/domain/support-message";
import { FormMessage } from "@/shared/ui/FormMessage";

export function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<SupportTicketReceipt[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/support/mine", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? data.error ?? "FAILED");
        }
        if (!cancelled) setTickets(data.tickets ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("تعذر تحميل طلبات التواصل.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted">جاري تحميل طلباتك...</p>;
  }

  if (error) {
    return <FormMessage variant="error">{error}</FormMessage>;
  }

  if (tickets.length === 0) {
    return (
      <p className="text-sm text-muted">
        لا طلبات تواصل بعد. يمكنك{" "}
        <Link className="font-semibold text-primary" href="/support">
          إرسال رسالة
        </Link>{" "}
        أو{" "}
        <Link className="font-semibold text-primary" href="/support/track">
          متابعة طلب برقم
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {tickets.map((ticket) => (
        <li
          key={ticket.ticketNumber}
          className="rounded-[var(--radius-xl)] border border-border px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink" dir="ltr">
                {ticket.ticketNumber}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {SUPPORT_TOPIC_LABELS[ticket.topic]} ·{" "}
                {new Date(ticket.createdAt).toLocaleString("ar-AE")}
              </p>
            </div>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-ink">
              {ticket.statusLabel}
            </span>
          </div>
          {ticket.resolutionNote ? (
            <p className="mt-2 text-sm text-muted">رد الفريق: {ticket.resolutionNote}</p>
          ) : null}
          <Link
            className="mt-2 inline-block text-xs font-semibold text-primary"
            href={`/support/track?ticket=${encodeURIComponent(ticket.ticketNumber)}&email=${encodeURIComponent(ticket.email)}`}
          >
            فتح صفحة المتابعة
          </Link>
        </li>
      ))}
    </ul>
  );
}
