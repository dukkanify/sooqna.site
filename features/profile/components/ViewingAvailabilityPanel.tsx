"use client";

import { useEffect, useState } from "react";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useToast } from "@/shared/components/ToastProvider";
import { Button } from "@/shared/ui/Button";
import { FormMessage } from "@/shared/ui/FormMessage";
import { listDefaultViewingTimeSlots } from "@/shared/constants/viewing-slots";

const WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export function ViewingAvailabilityPanel() {
  const { showToast } = useToast();
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [timeSlots, setTimeSlots] = useState<string[]>(listDefaultViewingTimeSlots());
  const [defaults, setDefaults] = useState<string[]>(listDefaultViewingTimeSlots());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/viewing-bookings/availability", {
          credentials: "include",
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as {
          availability?: { weekdays?: number[]; timeSlots?: string[] };
          defaultTimeSlots?: string[];
        };
        if (cancelled) return;
        if (Array.isArray(data.defaultTimeSlots) && data.defaultTimeSlots.length) {
          setDefaults(data.defaultTimeSlots);
        }
        if (data.availability) {
          if (Array.isArray(data.availability.weekdays)) {
            setWeekdays(data.availability.weekdays);
          }
          if (Array.isArray(data.availability.timeSlots)) {
            setTimeSlots(data.availability.timeSlots);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleDay(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function toggleSlot(slot: string) {
    setTimeSlots((current) =>
      current.includes(slot)
        ? current.filter((value) => value !== slot)
        : [...current, slot].sort(),
    );
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/viewing-bookings/availability", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekdays, timeSlots }),
      });
      if (!response.ok) {
        setMessage("تعذر حفظ أوقات المعاينة.");
        showToast("تعذر حفظ أوقات المعاينة", "error");
        return;
      }
      setMessage("تم حفظ أوقات المعاينة المتاحة.");
      showToast("تم حفظ أوقات المعاينة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <LocalizedTree>
      <div className="grid gap-4">
        <p className="text-sm font-medium leading-7 text-muted">
          حدّد أيام وساعات استقبال طلبات معاينة العقارات. تظهر هذه الأوقات
          لطالبي المعاينة عند الحجز.
        </p>

        {loading ? (
          <p className="text-sm text-muted">جاري التحميل...</p>
        ) : (
          <>
            <div>
              <p className="text-sm font-bold text-ink">أيام الأسبوع</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((day) => {
                  const active = weekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-primary text-white"
                          : "border border-border bg-surface text-muted"
                      }`}
                      onClick={() => toggleDay(day.value)}
                      type="button"
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-ink">الساعات المتاحة</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {defaults.map((slot) => {
                  const active = timeSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-primary text-white"
                          : "border border-border bg-surface text-muted"
                      }`}
                      dir="ltr"
                      onClick={() => toggleSlot(slot)}
                      type="button"
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {message ? (
              <FormMessage variant="success">{message}</FormMessage>
            ) : null}

            <div>
              <Button loading={saving} onClick={() => void save()} type="button">
                حفظ أوقات المعاينة
              </Button>
            </div>
          </>
        )}
      </div>
    </LocalizedTree>
  );
}
