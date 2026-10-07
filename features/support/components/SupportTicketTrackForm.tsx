"use client";

import { useState, type FormEvent } from "react";
import type { SupportTicketReceipt } from "@/types/domain/support-message";
import { SUPPORT_TOPIC_LABELS } from "@/types/domain/support-message";
import { Button } from "@/shared/ui/Button";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";

type SupportTicketTrackFormProps = {
  initialEmail?: string;
  initialTicket?: string;
};

export function SupportTicketTrackForm({
  initialEmail = "",
  initialTicket = "",
}: SupportTicketTrackFormProps) {
  const [ticketNumber, setTicketNumber] = useState(initialTicket);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<SupportTicketReceipt | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    setTicket(null);
    try {
      const response = await fetch("/api/support/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumber, email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "تعذر جلب حالة الطلب.");
        return;
      }
      setTicket(data.ticket as SupportTicketReceipt);
    } catch {
      setError("تعذر جلب حالة الطلب. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <form className="grid gap-3" onSubmit={handleSubmit}>
        {error ? <FormMessage variant="error">{error}</FormMessage> : null}
        <Input
          dir="ltr"
          label="رقم الطلب"
          name="ticketNumber"
          onChange={(event) => setTicketNumber(event.target.value)}
          placeholder="SQ-20261006-A3F9"
          required
          value={ticketNumber}
        />
        <Input
          dir="ltr"
          label="البريد الإلكتروني"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <Button loading={busy} type="submit" variant="accent">
          عرض حالة الطلب
        </Button>
      </form>

      {ticket ? (
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface-muted/40 p-4">
          <p className="text-xs font-bold tracking-wide text-secondary">
            نتيجة المتابعة
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">رقم الطلب</dt>
              <dd className="font-bold text-ink" dir="ltr">
                {ticket.ticketNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">الحالة</dt>
              <dd className="font-semibold text-ink">{ticket.statusLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">الموضوع</dt>
              <dd className="font-semibold text-ink">
                {SUPPORT_TOPIC_LABELS[ticket.topic]}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">تاريخ الإرسال</dt>
              <dd className="font-semibold text-ink">
                {new Date(ticket.createdAt).toLocaleString("ar-AE")}
              </dd>
            </div>
            {ticket.resolutionNote ? (
              <div className="grid gap-1 border-t border-border pt-2">
                <dt className="text-muted">رد الفريق</dt>
                <dd className="font-medium text-ink">{ticket.resolutionNote}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
