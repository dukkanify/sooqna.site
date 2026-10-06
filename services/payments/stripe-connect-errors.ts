export const STRIPE_CONNECT_NOT_ENABLED = "STRIPE_CONNECT_NOT_ENABLED";

export const SELLER_CONNECT_UNAVAILABLE_AR =
  "الاستلام البنكي المباشر غير مفعّل على المنصة حالياً. مبلغ الضمان يبقى في محفظة سوقنا حتى تفعيل التحويل.";

const CONNECT_NOT_ENABLED_RE =
  /signed up for Connect|Connect is not enabled|cannot create connected accounts|dashboard\.stripe\.com\/connect/i;

function flattenErrorText(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const rawMessage =
      typeof (error as { raw?: { message?: string } }).raw?.message === "string"
        ? (error as { raw: { message: string } }).raw.message
        : "";
    return `${error.name} ${error.message} ${rawMessage}`;
  }
  if (typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
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
  return SELLER_CONNECT_UNAVAILABLE_AR;
}
