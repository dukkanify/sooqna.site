const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  welcome: "ترحيب",
  order_paid: "تم الدفع",
  payment_required: "مطلوب الدفع",
  order_confirmed: "تأكيد الطلب",
  order_released: "تحرير الضمان",
  order_refunded: "استرداد",
  order_disputed: "نزاع",
  seller_proof: "إثبات البائع",
  buyer_match: "مطابقة مشتري",
  escrow_held: "ضمان محجوز",
  job_application: "طلب وظيفة",
  viewing_booking: "موعد معاينة",
  quote_request: "طلب عرض سعر",
  account_verified: "توثيق الحساب",
  account_approved: "اعتماد الحساب",
  account_pending_approval: "بانتظار الاعتماد",
  listing_report: "بلاغ إعلان",
  support_message: "رسالة دعم",
  listing_received: "استلام إعلان",
  listing_approved: "الموافقة على إعلان",
  listing_rejected: "رفض إعلان",
  listing_featured: "إعلان مميز",
  stripe_active: "Stripe نشط",
  stripe_requirements: "متطلبات Stripe",
  escrow_auto_released: "تحرير ضمان تلقائي",
  saved_search_match: "نتيجة بحث محفوظ",
  seller_followed_listing: "إعلان من بائع تتابعه",
  chat_message: "رسالة محادثة",
};

const EMAIL_EVENT_TYPE_LABELS: Record<string, string> = {
  listing_received: "استلام إعلان",
  listing_approved: "الموافقة على إعلان",
  listing_rejected: "رفض إعلان",
  order_paid: "دفع طلب",
  order_invoice: "فاتورة طلب",
  order_seller_new: "طلب جديد للبائع",
  order_confirmed: "تأكيد الطلب",
  order_released: "تحرير الضمان",
  order_refunded: "استرداد",
  order_disputed: "نزاع",
  seller_proof: "إثبات البائع",
  chat_message: "رسالة محادثة",
  password_reset: "إعادة تعيين كلمة المرور",
  featured_paid: "تمييز مدفوع",
  stripe_active: "Stripe نشط",
  stripe_requirements: "متطلبات Stripe",
};

function lookupLabel(map: Record<string, string>, type: string, fallback: string) {
  const key = String(type ?? "").trim();
  if (!key) return fallback;
  return map[key] ?? fallback;
}

export function notificationTypeLabel(type: string | null | undefined): string {
  return lookupLabel(NOTIFICATION_TYPE_LABELS, String(type ?? ""), "إشعار");
}

export function emailEventTypeLabel(type: string | null | undefined): string {
  return lookupLabel(EMAIL_EVENT_TYPE_LABELS, String(type ?? ""), "بريد");
}
