import type { Order } from "@/types/domain/order";
import type { AdminListingRecord } from "@/types/domain/admin";
import { isSucceededPaidOrder } from "@/services/admin/admin-finance-metrics";
import { isConfirmedFixtureListing } from "@/services/listings/mock-catalog-policy";

export type DailyPoint = {
  date: string;
  label: string;
  orders: number;
  /** GMV for the bucket — merchandise (productPrice), not buyer total. */
  volume: number;
  /** Platform commissions (platformFee). */
  fees: number;
};

export type StatusSlice = {
  key: string;
  label: string;
  count: number;
};

export function buildDailySeries(orders: Order[], days = 7): DailyPoint[] {
  const bucketDays = days >= 90 ? 7 : 1;
  const bucketCount = Math.ceil(days / bucketDays);
  const points: DailyPoint[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = bucketCount - 1; i >= 0; i -= 1) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * bucketDays);
    const start = new Date(end);
    start.setDate(start.getDate() - (bucketDays - 1));
    const startKey = start.toISOString().slice(0, 10);
    const endKey = end.toISOString().slice(0, 10);
    const label =
      bucketDays === 1
        ? end.toLocaleDateString("ar-AE", { weekday: "short", day: "numeric" })
        : `${start.getDate()}/${start.getMonth() + 1}`;

    const bucketOrders = orders.filter((order) => {
      if (!isSucceededPaidOrder(order)) return false;
      const day = (order.paidAt || order.createdAt)?.slice(0, 10);
      if (!day) return false;
      return day >= startKey && day <= endKey;
    });

    points.push({
      date: endKey,
      label,
      orders: bucketOrders.length,
      volume: bucketOrders.reduce(
        (sum, o) => sum + Math.max(0, o.fees?.productPrice ?? 0),
        0,
      ),
      fees: bucketOrders.reduce(
        (sum, o) => sum + Math.max(0, o.fees?.platformFee ?? 0),
        0,
      ),
    });
  }

  return points;
}

export function buildOrderStatusSlices(orders: Order[]): StatusSlice[] {
  const map = new Map<string, number>();
  for (const order of orders) {
    map.set(order.status, (map.get(order.status) ?? 0) + 1);
  }

  const labels: Record<string, string> = {
    pending_payment: "بانتظار الدفع",
    paid_held_in_escrow: "مدفوع — ضمان",
    seller_preparing: "تجهيز",
    shipped: "شحن",
    ready_for_pickup: "جاهز للاستلام",
    delivered: "تم التسليم",
    confirmed: "مؤكد",
    released: "محرّر",
    refunded: "مسترد",
    disputed: "نزاع",
    cancelled: "ملغى",
  };

  return [...map.entries()]
    .map(([key, count]) => ({
      key,
      label: labels[key] ?? key,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function isMarketplaceAdminListing(listing: AdminListingRecord): boolean {
  if (listing.isDemo === true || listing.source === "SOOQNA_SHOWCASE") {
    return false;
  }
  if (listing.isFixture === true || isConfirmedFixtureListing(listing)) {
    return false;
  }
  return true;
}

export function buildListingCategorySlices(
  listings: AdminListingRecord[],
): StatusSlice[] {
  const map = new Map<string, number>();
  for (const listing of listings) {
    if (!isMarketplaceAdminListing(listing)) continue;
    map.set(listing.categoryId, (map.get(listing.categoryId) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function buildPaymentStatusSlices(orders: Order[]): StatusSlice[] {
  const map = new Map<string, number>();
  for (const order of orders) {
    map.set(order.paymentStatus, (map.get(order.paymentStatus) ?? 0) + 1);
  }
  const labels: Record<string, string> = {
    pending: "معلّق",
    processing: "قيد المعالجة",
    succeeded: "ناجح",
    failed: "فشل",
    refunded: "مسترد",
    cancelled: "ملغى",
  };
  return [...map.entries()]
    .map(([key, count]) => ({
      key,
      label: labels[key] ?? key,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
