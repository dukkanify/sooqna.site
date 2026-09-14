"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BuyAgainDecision } from "@/services/payments/buy-again-action";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";

type OrderRepurchaseActionsProps = {
  orderId: string;
  decision: BuyAgainDecision;
};

export function OrderRepurchaseActions({
  orderId,
  decision,
}: OrderRepurchaseActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inflight = useRef(false);

  const listingHref = decision.listingPublic
    ? decision.listingSlug
      ? `/listings/${decision.listingSlug}`
      : undefined
    : undefined;

  async function runAction() {
    if (inflight.current || busy) return;
    inflight.current = true;
    setBusy(true);
    setError("");
    try {
      if (
        (decision.kind === "buy_again" || decision.kind === "repurchase") &&
        decision.checkoutPath
      ) {
        router.push(decision.checkoutPath);
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/buy-again`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `${orderId}:buy-again`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.decision?.message ?? "تعذر إكمال العملية.");
        return;
      }
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data.checkoutPath || data.decision?.checkoutPath) {
        router.push(data.checkoutPath ?? data.decision.checkoutPath);
        return;
      }
      setError("تعذر بدء الدفع.");
    } catch {
      setError("تعذر إكمال العملية.");
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  if (decision.kind === "none") return null;

  const showPrimary =
    decision.kind === "complete_payment" ||
    decision.kind === "retry_payment" ||
    decision.kind === "buy_again" ||
    decision.kind === "repurchase";

  return (
    <Card className="sticky bottom-3 z-20 w-full min-w-0 overflow-x-hidden p-5 shadow-[var(--shadow-md)] md:static md:shadow-none">
      {decision.listingTitle ? (
        <p className="text-sm font-semibold text-ink">{decision.listingTitle}</p>
      ) : null}
      {decision.currentPrice != null &&
      (decision.kind === "buy_again" ||
        decision.kind === "repurchase" ||
        decision.kind === "unavailable" ||
        decision.kind === "listing_gone" ||
        decision.kind === "seller_inactive") ? (
        <div className="mt-3 grid gap-1 text-sm">
          {decision.priceChanged && decision.previousPrice != null ? (
            <div className="flex justify-between text-muted">
              <span>السعر السابق</span>
              <CurrencyAmount amount={decision.previousPrice} size="sm" />
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted">السعر الحالي</span>
            <CurrencyAmount amount={decision.currentPrice} size="md" />
          </div>
          {decision.priceChanged ? (
            <p className="text-xs text-muted">
              إعادة الشراء تستخدم السعر الحالي للإعلان، وليس سعر الطلب السابق.
            </p>
          ) : null}
        </div>
      ) : null}

      {decision.message ? (
        <p className="mt-3 text-sm font-medium text-ink">{decision.message}</p>
      ) : null}

      {error ? (
        <div className="mt-3">
          <FormMessage variant="error">{error}</FormMessage>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {showPrimary ? (
          <Button
            disabled={busy}
            fullWidth
            loading={busy}
            onClick={runAction}
            size="lg"
            type="button"
            variant="accent"
          >
            {decision.label}
          </Button>
        ) : null}
        {listingHref && decision.kind !== "complete_payment" && decision.kind !== "retry_payment" ? (
          <Button fullWidth href={listingHref} size="md" variant="secondary">
            عرض الإعلان
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
