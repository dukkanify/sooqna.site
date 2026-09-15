"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

export type ConnectStatus = {
  status: string;
  statusLabelAr: string;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  platformConfigured: boolean;
  canOpenDashboard: boolean;
};

type SellerPayoutConnectCardProps = {
  autoStart?: boolean;
  initialConnect: ConnectStatus;
};

export function SellerPayoutConnectCard({
  autoStart = false,
  initialConnect,
}: SellerPayoutConnectCardProps) {
  const [connect, setConnect] = useState<ConnectStatus>(initialConnect);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const runAction = useCallback(
    async (action: "onboard" | "dashboard" | "refresh-status") => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch("/api/seller/stripe/connect", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          url?: string;
          connect?: ConnectStatus;
          error?: string;
          message?: string;
        };
        if (!response.ok) {
          throw new Error(data.message || data.error || "CONNECT_ACTION_FAILED");
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (data.connect) {
          startTransition(() => setConnect(data.connect!));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "CONNECT_ACTION_FAILED");
      } finally {
        setBusy(false);
      }
    },
    [startTransition],
  );

  const active = connect.status === "ACTIVE" && connect.payoutsEnabled;
  const needsSetup =
    Boolean(connect.platformConfigured) &&
    !active &&
    connect.status !== "UNDER_VERIFICATION";

  return (
    <LocalizedTree>
      <Card className="grid gap-4 p-6" variant="flat">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-10 place-items-center rounded-full border border-border bg-surface-muted text-ink">
            <Icon name="shield" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-ink">استلام مبالغ الضمان</h2>
            <p className="mt-1.5 text-sm leading-7 text-muted">
              اربط حساب Stripe لاستلام صافي الضمان مباشرة عند تأكيد المشتري. بدون الربط يبقى
              المبلغ في رصيد المحفظة الداخلي فقط.
            </p>
          </div>
        </div>

        {autoStart && needsSetup ? (
          <p className="text-sm leading-7 text-amber-800">
            لم يكتمل إعداد Stripe — اضغط «ربط حساب الاستلام» للمتابعة من حيث توقفت.
          </p>
        ) : null}

        <div className="rounded-[1rem] border border-border bg-surface-muted px-4 py-3">
          <p className="text-xs font-semibold text-muted">الحالة</p>
          <p className="mt-1 text-sm font-bold text-ink">{connect.statusLabelAr}</p>
          {connect.stripeAccountId ? (
            <p className="mt-1 text-[11px] text-muted" dir="ltr">
              {connect.stripeAccountId}
            </p>
          ) : null}
          {!connect.platformConfigured ? (
            <p className="mt-2 text-xs leading-6 text-amber-700">
              مفاتيح Stripe للمنصة غير مضبوطة حالياً — الربط يتاح بعد تفعيل الدفع.
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {needsSetup ? (
            <Button
              disabled={busy || !connect.platformConfigured}
              onClick={() => void runAction("onboard")}
              type="button"
              variant="primary"
            >
              {busy ? "جارٍ التحويل…" : "ربط حساب الاستلام"}
            </Button>
          ) : null}
          {connect.canOpenDashboard ? (
            <Button
              disabled={busy}
              onClick={() => void runAction("dashboard")}
              type="button"
              variant="secondary"
            >
              لوحة Stripe
            </Button>
          ) : null}
          <Button
            disabled={busy}
            onClick={() => void runAction("refresh-status")}
            type="button"
            variant="ghost"
          >
            تحديث الحالة
          </Button>
        </div>

        {active ? (
          <p className="text-xs leading-6 text-success">
            حسابك جاهز — عند تحرير الضمان يُحوَّل صافي البائع إلى Stripe Connect تلقائياً.
          </p>
        ) : null}
      </Card>
    </LocalizedTree>
  );
}
