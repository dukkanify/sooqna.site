export const STRIPE_CONNECT_NOT_ENABLED = "STRIPE_CONNECT_NOT_ENABLED";

export const SELLER_CONNECT_UNAVAILABLE_AR =
  "الاستلام البنكي المباشر غير مفعّل على المنصة حالياً. مبلغ الضمان يبقى في محفظة سوقنا حتى تفعيل التحويل.";

const CONNECT_NOT_ENABLED_RE =
  /signed up for Connect|Connect is not enabled|cannot create connected accounts|dashboard\.stripe\.com\/connect/i;

function flattenErrorText(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const maybeRaw = (error as unknown as { raw?: { message?: string } }).raw
      ?.message;
    const rawMessage = typeof maybeRaw === "string" ? maybeRaw : "";
    return `${error.name} ${error.message} ${rawMessage}`;
  }
  if (typeof error === "object") {
    const record = error as {
      message?: unknown;
      raw?: { message?: unknown };
    };
    const maybeMessage =
      typeof record.message === "string" ? record.message : "";
    const maybeRaw =
      typeof record.raw?.message === "string" ? record.raw.message : "";
    try {
      return `${maybeMessage} ${maybeRaw} ${JSON.stringify(error)}`;
    } catch {
      return [maybeMessage, maybeRaw].filter(Boolean).join(" ") || String(error);
    }
  }
  return String(error);
}

export function isConnectSignupDisabledError(error: unknown): boolean {
  const text = flattenErrorText(error);
  return (
    text.includes(STRIPE_CONNECT_NOT_ENABLED) ||
    CONNECT_NOT_ENABLED_RE.test(text)
  );
}

export function sellerConnectPublicMessage(error: unknown): string {
  const raw = flattenErrorText(error);
  if (raw.includes("STRIPE_NOT_CONFIGURED")) {
    return "مفاتيح Stripe للمنصة غير جاهزة حالياً. المبلغ يبقى في محفظة سوقنا.";
  }
  if (
    raw.includes("STRIPE_NOT_CONNECTED") ||
    raw.includes("STRIPE_ONBOARDING_INCOMPLETE")
  ) {
    return "أكمل ربط حساب الاستلام من الزر أدناه.";
  }
  if (isConnectSignupDisabledError(error)) {
    return SELLER_CONNECT_UNAVAILABLE_AR;
  }
  return "تعذر إكمال ربط الاستلام حالياً. حاول «تحديث الحالة» ثم أعد المحاولة.";
}
