"use client";

import { useState } from "react";
import type { ActivityRecord } from "@/types/domain/activity";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { listDefaultViewingTimeSlots } from "@/shared/constants/viewing-slots";

type ViewingRequestActionsProps = {
  item: ActivityRecord;
  busy: boolean;
  onPatch: (status: string, extra?: {
    proposedDate?: string;
    proposedTime?: string;
    proposedNote?: string;
  }) => Promise<void>;
};

export function ViewingRequestActions({
  item,
  busy,
  onPatch,
}: ViewingRequestActionsProps) {
  const [showPropose, setShowPropose] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState(listDefaultViewingTimeSlots()[0] ?? "10:00");
  const [proposedNote, setProposedNote] = useState("");

  const isReceived = item.scope === "received";
  const isMine = item.scope === "mine";

  return (
    <div className="mt-2 grid gap-2 border-t border-border/60 pt-2">
      <dl className="grid gap-1 text-[11px] text-muted sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-ink">موعد المعاينة</dt>
          <dd dir="ltr">
            {item.viewingDate} · {item.viewingTime}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">التواصل</dt>
          <dd dir="ltr">{item.viewingPhone}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">عدد الزوار</dt>
          <dd>{item.viewingVisitors ?? "—"}</dd>
        </div>
        {item.viewingNotes ? (
          <div className="sm:col-span-2">
            <dt className="font-semibold text-ink">ملاحظات</dt>
            <dd>{item.viewingNotes}</dd>
          </div>
        ) : null}
        {item.proposedDate && item.proposedTime ? (
          <div className="sm:col-span-2 rounded-md bg-secondary-soft p-2 text-primary">
            <dt className="font-semibold">تعديل مقترح</dt>
            <dd dir="ltr">
              {item.proposedDate} · {item.proposedTime}
            </dd>
            {item.proposedNote ? <dd className="mt-1">{item.proposedNote}</dd> : null}
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-1.5">
        {isReceived && item.status === "pending" ? (
          <>
            <Button
              loading={busy}
              onClick={() => void onPatch("confirmed")}
              size="sm"
              type="button"
            >
              اعتماد الموعد
            </Button>
            <Button
              loading={busy}
              onClick={() => setShowPropose((value) => !value)}
              size="sm"
              type="button"
              variant="secondary"
            >
              اقتراح تعديل
            </Button>
            <Button
              loading={busy}
              onClick={() => void onPatch("cancelled")}
              size="sm"
              type="button"
              variant="secondary"
            >
              إلغاء
            </Button>
          </>
        ) : null}

        {isReceived && item.status === "confirmed" ? (
          <>
            <Button
              loading={busy}
              onClick={() => void onPatch("completed")}
              size="sm"
              type="button"
              variant="secondary"
            >
              إكمال
            </Button>
            <Button
              loading={busy}
              onClick={() => void onPatch("cancelled")}
              size="sm"
              type="button"
              variant="secondary"
            >
              إلغاء
            </Button>
          </>
        ) : null}

        {isMine && item.status === "modification_proposed" ? (
          <>
            <Button
              loading={busy}
              onClick={() => void onPatch("confirmed")}
              size="sm"
              type="button"
            >
              قبول الموعد المقترح
            </Button>
            <Button
              loading={busy}
              onClick={() => void onPatch("cancelled")}
              size="sm"
              type="button"
              variant="secondary"
            >
              إلغاء الطلب
            </Button>
          </>
        ) : null}

        {isMine && (item.status === "pending" || item.status === "confirmed") ? (
          <Button
            loading={busy}
            onClick={() => void onPatch("cancelled")}
            size="sm"
            type="button"
            variant="secondary"
          >
            إلغاء الموعد
          </Button>
        ) : null}
      </div>

      {showPropose ? (
        <div className="grid gap-2 rounded-md bg-surface-muted p-3">
          <Input
            compact
            label="التاريخ المقترح"
            onChange={(event) => setProposedDate(event.target.value)}
            type="date"
            value={proposedDate}
          />
          <label className="grid gap-1 text-xs font-semibold text-ink">
            الوقت المقترح
            <select
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              dir="ltr"
              onChange={(event) => setProposedTime(event.target.value)}
              value={proposedTime}
            >
              {listDefaultViewingTimeSlots().map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
          <Input
            compact
            label="ملاحظة (اختياري)"
            onChange={(event) => setProposedNote(event.target.value)}
            type="text"
            value={proposedNote}
          />
          <Button
            loading={busy}
            onClick={() =>
              void onPatch("modification_proposed", {
                proposedDate,
                proposedTime,
                proposedNote,
              })
            }
            size="sm"
            type="button"
          >
            إرسال التعديل المقترح
          </Button>
        </div>
      ) : null}

      {item.listingSlug || item.listingId ? (
        <a
          className="text-[11px] font-semibold text-primary"
          href={
            item.listingId?.startsWith("local-")
              ? `/listings/local/${item.listingId}`
              : item.listingSlug
                ? `/listings/${item.listingSlug}`
                : "/search"
          }
        >
          فتح الإعلان المرتبط
        </a>
      ) : null}
    </div>
  );
}
