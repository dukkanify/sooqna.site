import type { UserProfile } from "@/types/domain/user";
import { hasAdminPermission } from "@/services/auth/admin-permission-checks";
import { getAdminAuditLog } from "@/services/admin/admin-audit-store";
import {
  buildDailySeries,
  buildListingCategorySlices,
  buildOrderStatusSlices,
  buildPaymentStatusSlices,
} from "@/services/admin/admin-analytics";
import { getAdminDisputes, getOpenDisputeCount } from "@/services/admin/dispute-store";
import { getAdminSettings } from "@/services/admin/admin-settings-store";
import { getAllUsers } from "@/services/auth/user-store";
import { getAdminCategoryRecords } from "@/services/categories/category-store";
import { getAllFavorites } from "@/services/favorites/favorite-store";
import { getAllJobApplications } from "@/services/job-applications/job-application-store";
import {
  getAdminListingRecords,
  getAllListings,
  getListingsModerationSummary,
} from "@/services/listings/listing-store";
import { getAllNotifications } from "@/services/payments/notification-store";
import { getAllOrders } from "@/services/payments/order-store";
import { getPaymentEvents } from "@/services/payments/payment-log";
import { getAllWalletAccounts } from "@/services/payments/wallet-ledger";
import { getAllListingReports } from "@/services/listings/listing-report-store";
import { getAllQuoteRequests } from "@/services/quote-requests/quote-request-store";
import { getAllViewingBookings } from "@/services/viewing-bookings/viewing-booking-store";
import {
  ensureStripeConfigLoaded,
  getStripeCurrency,
  getStripePublishableKey,
  getStripeWebhookSecret,
  isMockCheckoutAllowed,
  isStripeConfigured,
} from "@/services/payments/payment-config";
import { orderRequiresProductConditionVerification } from "@/shared/listings/escrow-eligibility";

export type DashboardRange = 7 | 30 | 90;

export type Severity = "critical" | "high" | "medium" | "low";

export type DashboardKpiCard = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  href: string;
  icon: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  money?: boolean;
};

export type DashboardActionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  severity: Severity;
  oldestAgeLabel?: string;
  meta?: string;
};

function parseRange(raw: string | null | undefined): DashboardRange {
  const n = Number(raw);
  if (n === 30 || n === 90) return n;
  return 7;
}

function msAgo(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Date.now() - t;
}

function formatAge(ms: number | null): string | undefined {
  if (ms == null || ms < 0) return undefined;
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "منذ أقل من ساعة";
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function userCreatedMs(user: { createdAt?: string; joinedAt?: string }): number {
  const raw = user.createdAt || (user.joinedAt ? `${user.joinedAt}T00:00:00.000Z` : "");
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function severityForCount(count: number, criticalAt: number, highAt: number): Severity {
  if (count >= criticalAt) return "critical";
  if (count >= highAt) return "high";
  if (count > 0) return "medium";
  return "low";
}

export async function buildAdminDashboard(
  admin: UserProfile,
  rangeParam?: string | null,
) {
  await ensureStripeConfigLoaded();
  const rangeDays = parseRange(rangeParam);
  const rangeStart = Date.now() - rangeDays * 86_400_000;
  const settings = await getAdminSettings();
  const canPayments = hasAdminPermission(admin, "payments");
  const canListings = hasAdminPermission(admin, "listings");
  const canUsers = hasAdminPermission(admin, "users");
  const canDisputes = hasAdminPermission(admin, "disputes");
  const canOrders = hasAdminPermission(admin, "orders");
  const canReports = hasAdminPermission(admin, "reports");
  const canCategories = hasAdminPermission(admin, "categories");

  const [
    users,
    listings,
    listingStats,
    adminListings,
    categories,
    openDisputes,
    disputes,
    orders,
    events,
    jobs,
    bookings,
    quotes,
    listingReports,
    wallets,
    audit,
    notifications,
    favorites,
  ] = await Promise.all([
    getAllUsers(),
    getAllListings(),
    getListingsModerationSummary(),
    getAdminListingRecords(),
    getAdminCategoryRecords(),
    getOpenDisputeCount(),
    getAdminDisputes(),
    getAllOrders(),
    getPaymentEvents(),
    getAllJobApplications(),
    getAllViewingBookings(),
    getAllQuoteRequests(),
    getAllListingReports(),
    getAllWalletAccounts(),
    getAdminAuditLog(30),
    getAllNotifications(),
    getAllFavorites(),
  ]);

  const categoryNameById = new Map(
    categories.map((c) => [c.id, c.name || c.id] as const),
  );

  const paid = orders.filter((o) => o.paymentStatus === "succeeded");
  const refunded = orders.filter((o) => o.status === "refunded" || o.paymentStatus === "refunded");
  const heldEscrow = orders.filter((o) => o.escrowStatus === "held");
  const pendingPayments = orders.filter(
    (o) => o.paymentStatus === "pending" || o.paymentStatus === "processing",
  );
  const failedPayments = orders.filter((o) => o.paymentStatus === "failed");
  const volume = paid.reduce((sum, o) => sum + o.fees.total, 0);
  const fees = paid.reduce((sum, o) => sum + o.fees.platformFee, 0);
  const heldAmount = heldEscrow.reduce((sum, o) => sum + o.fees.productPrice, 0);
  const refundedAmount = refunded.reduce((sum, o) => sum + o.fees.total, 0);
  const walletHeld = wallets.reduce((sum, w) => sum + w.heldInEscrow, 0);

  const rejectedListings = listings.filter((l) => l.status === "rejected").length;
  const pendingListingRows = listings.filter((l) => l.status === "pending_review");
  const oldestPendingListingMs = pendingListingRows.reduce<number | null>((oldest, row) => {
    const age = msAgo(row.postedAt || row.expiresAt);
    if (age == null) return oldest;
    if (oldest == null || age > oldest) return age;
    return oldest;
  }, null);

  const newUsers = users.filter((u) => userCreatedMs(u) >= rangeStart).length;
  const pendingApprovalUsers = users.filter(
    (u) => u.accountStatus === "pending" && Boolean(u.emailVerifiedAt),
  );
  const suspendedUsers = users.filter((u) => u.accountStatus === "suspended");

  const openDisputeRows = disputes.filter(
    (d) => d.status === "open" || d.status === "under_review",
  );
  const oldestDisputeMs = openDisputeRows.reduce<number | null>((oldest, row) => {
    const age = msAgo(row.createdAt);
    if (age == null) return oldest;
    if (oldest == null || age > oldest) return age;
    return oldest;
  }, null);

  const holdMs = settings.escrowHoldDays * 86_400_000;
  const overdueEscrow = heldEscrow.filter((o) => {
    const age = msAgo(o.updatedAt || o.createdAt);
    return age != null && age > holdMs;
  });

  const incompleteEvidence = orders.filter((o) => {
    if (!orderRequiresProductConditionVerification(o)) return false;
    if (o.escrowStatus !== "held" && o.status !== "paid_held_in_escrow" && o.status !== "delivered") {
      return false;
    }
    const status = o.productVerificationStatus;
    return !status || status === "awaiting_seller";
  });

  const submittedJobs = jobs.filter((j) => j.status === "submitted");
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const openQuotes = quotes.filter((q) => q.status === "submitted");
  const openListingReports = listingReports.filter((r) => r.status === "open");

  const favCountByListing = new Map<string, number>();
  for (const fav of favorites) {
    const id = fav.listingId;
    if (!id) continue;
    favCountByListing.set(id, (favCountByListing.get(id) ?? 0) + 1);
  }

  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
  const totalFavorites = favorites.length;

  const topListings = [...listings]
    .map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      categoryId: l.categoryId,
      categoryLabel: categoryNameById.get(l.categoryId) ?? l.categoryId,
      sellerName: l.seller?.name ?? "—",
      status: l.status,
      views: l.views || 0,
      favorites: favCountByListing.get(l.id) ?? 0,
      href: `/admin/listings?q=${encodeURIComponent(l.id)}`,
    }))
    .sort((a, b) => b.views - a.views || b.favorites - a.favorites)
    .slice(0, 8);

  const categoryPerf = buildListingCategorySlices(adminListings).map((slice) => {
    const catListings = listings.filter((l) => l.categoryId === slice.key);
    const views = catListings.reduce((sum, l) => sum + (l.views || 0), 0);
    const share =
      totalViews > 0 ? Math.round((views / totalViews) * 100) : 0;
    return {
      key: slice.key,
      label: categoryNameById.get(slice.key) ?? slice.key,
      listings: slice.count,
      views,
      viewSharePercent: share,
      href: `/admin/listings?category=${encodeURIComponent(slice.key)}`,
    };
  });

  const executive: DashboardKpiCard[] = [];
  if (canListings) {
    executive.push(
      {
        key: "totalListings",
        label: "إجمالي الإعلانات",
        value: listingStats.totalListings,
        href: "/admin/listings",
        icon: "grid",
        hint: "كل الإعلانات",
      },
      {
        key: "activeListings",
        label: "الإعلانات المنشورة",
        value: listingStats.activeListings,
        href: "/admin/listings?status=active",
        icon: "check",
        tone: "success",
        hint: "منشورة للعامة",
      },
      {
        key: "pendingListings",
        label: "الإعلانات المعلقة",
        value: listingStats.pendingListings,
        href: "/admin/listings?status=pending_review",
        icon: "clock",
        tone: listingStats.pendingListings > 0 ? "warning" : "neutral",
        hint: listingStats.pendingListings > 0 ? "تحتاج مراجعة" : "لا يوجد انتظار",
      },
    );
  }
  if (canUsers) {
    executive.push(
      {
        key: "totalUsers",
        label: "المستخدمون",
        value: users.length,
        href: "/admin/users",
        icon: "user",
        hint: "حسابات مسجّلة",
      },
      {
        key: "newUsers",
        label: "المستخدمون الجدد",
        value: newUsers,
        href: "/admin/users?range=recent",
        icon: "plus",
        hint: `آخر ${rangeDays} يوم`,
      },
    );
  }
  if (canPayments) {
    executive.push(
      {
        key: "revenue",
        label: "إجمالي الإيرادات",
        value: fees,
        href: "/admin/reports",
        icon: "wallet",
        money: true,
        tone: "success",
        hint: "رسوم المنصة",
      },
      {
        key: "heldMadmoon",
        label: "المبالغ المحتجزة في مضمون",
        value: heldAmount,
        href: "/admin/escrow",
        icon: "shield",
        money: true,
        tone: heldEscrow.length > 0 ? "warning" : "neutral",
        hint: `${heldEscrow.length} عملية محجوزة`,
      },
    );
  }
  if (canDisputes) {
    executive.push({
      key: "openDisputes",
      label: "النزاعات المفتوحة",
      value: openDisputes,
      href: "/admin/disputes?status=open",
      icon: "message",
      tone: openDisputes > 0 ? "danger" : "neutral",
      hint: openDisputes > 0 ? "تحتاج حكم" : "لا نزاعات",
    });
  }

  const actionItems: DashboardActionItem[] = [];
  if (canListings && listingStats.pendingListings > 0) {
    actionItems.push({
      id: "pending-listings",
      label: "إعلانات بانتظار المراجعة",
      count: listingStats.pendingListings,
      href: "/admin/listings?status=pending_review",
      severity: severityForCount(listingStats.pendingListings, 20, 5),
      oldestAgeLabel: formatAge(oldestPendingListingMs),
      meta: "اعتماد أو رفض",
    });
  }
  if (canUsers && pendingApprovalUsers.length > 0) {
    actionItems.push({
      id: "pending-users",
      label: "حسابات تحتاج مراجعة",
      count: pendingApprovalUsers.length,
      href: "/admin/users?status=pending",
      severity: severityForCount(pendingApprovalUsers.length, 10, 3),
      meta: "اعتماد بعد التحقق",
    });
  }
  if (canDisputes && openDisputes > 0) {
    actionItems.push({
      id: "open-disputes",
      label: "نزاعات مفتوحة",
      count: openDisputes,
      href: "/admin/disputes?status=open",
      severity: severityForCount(openDisputes, 5, 2),
      oldestAgeLabel: formatAge(oldestDisputeMs),
      meta: "تحتاج حكم إداري",
    });
  }
  if (canPayments && overdueEscrow.length > 0) {
    actionItems.push({
      id: "overdue-escrow",
      label: "عمليات مضمون تجاوزت المدة",
      count: overdueEscrow.length,
      href: "/admin/escrow",
      severity: "critical",
      meta: `أقدم من ${settings.escrowHoldDays} يوم`,
    });
  }
  if (canOrders && incompleteEvidence.length > 0) {
    actionItems.push({
      id: "incomplete-evidence",
      label: "توثيق منتج ناقص",
      count: incompleteEvidence.length,
      href: "/admin/orders",
      severity: "high",
      meta: "Evidence مطلوب",
    });
  }
  if (canListings && openListingReports.length > 0) {
    actionItems.push({
      id: "listing-reports",
      label: "بلاغات إعلانات",
      count: openListingReports.length,
      href: "/admin/listing-reports",
      severity: severityForCount(openListingReports.length, 10, 3),
      meta: "بانتظار المراجعة",
    });
  }
  if (submittedJobs.length > 0) {
    actionItems.push({
      id: "job-apps",
      label: "طلبات توظيف معلقة",
      count: submittedJobs.length,
      href: "/admin/job-applications",
      severity: "medium",
      meta: "وارد",
    });
  }
  if (canPayments && pendingPayments.length > 0) {
    actionItems.push({
      id: "pending-payments",
      label: "معاملات معلّقة",
      count: pendingPayments.length,
      href: "/admin/orders",
      severity: severityForCount(pendingPayments.length, 10, 3),
      meta: "بانتظار إكمال الدفع",
    });
  }
  if (canPayments && failedPayments.length > 0) {
    actionItems.push({
      id: "failed-payments",
      label: "دفعات فاشلة تحتاج متابعة",
      count: failedPayments.length,
      href: "/admin/orders",
      severity: "high",
      meta: "مراجعة بوابة الدفع",
    });
  }
  actionItems.sort((a, b) => {
    const rank: Record<Severity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return rank[a.severity] - rank[b.severity] || b.count - a.count;
  });

  type QueueRow = {
    id: string;
    label: string;
    count: number;
    severity: Severity;
    oldestAgeLabel?: string;
    href: string;
    actionLabel: string;
  };

  const operationsQueues: QueueRow[] = (
    [
      canListings
        ? {
            id: "listings-review",
            label: "إعلانات تحتاج مراجعة",
            count: listingStats.pendingListings,
            severity: severityForCount(listingStats.pendingListings, 20, 5),
            oldestAgeLabel: formatAge(oldestPendingListingMs),
            href: "/admin/listings?status=pending_review",
            actionLabel: "فتح قائمة المراجعة",
          }
        : null,
      canUsers
        ? {
            id: "users-review",
            label: "حسابات تحتاج مراجعة",
            count: pendingApprovalUsers.length,
            severity: severityForCount(pendingApprovalUsers.length, 10, 3),
            href: "/admin/users?status=pending",
            actionLabel: "فتح المستخدمين",
          }
        : null,
      {
        id: "jobs-pending",
        label: "طلبات توظيف معلقة",
        count: submittedJobs.length,
        severity: severityForCount(submittedJobs.length, 15, 5),
        href: "/admin/job-applications",
        actionLabel: "فتح الطلبات",
      },
      canOrders
        ? {
            id: "orders-pending",
            label: "عمليات معلقة",
            count: pendingPayments.length + failedPayments.length,
            severity: severityForCount(
              pendingPayments.length + failedPayments.length,
              10,
              3,
            ),
            href: "/admin/orders",
            actionLabel: "فتح الطلبات",
          }
        : null,
      {
        id: "bookings-pending",
        label: "طلبات تحتاج موافقة",
        count: pendingBookings.length + openQuotes.length,
        severity: severityForCount(
          pendingBookings.length + openQuotes.length,
          10,
          3,
        ),
        href: "/admin/activities",
        actionLabel: "فتح الأنشطة",
      },
      canListings
        ? {
            id: "reports-open",
            label: "بلاغات",
            count: openListingReports.length,
            severity: severityForCount(openListingReports.length, 10, 3),
            href: "/admin/listing-reports",
            actionLabel: "فتح البلاغات",
          }
        : null,
      canListings
        ? {
            id: "rejected-followup",
            label: "عناصر مرفوضة تحتاج متابعة",
            count: rejectedListings,
            severity: severityForCount(rejectedListings, 30, 10),
            href: "/admin/listings?status=rejected",
            actionLabel: "فتح المرفوض",
          }
        : null,
    ] as Array<QueueRow | null>
  ).filter((row): row is QueueRow => row != null);

  const risk = {
    openDisputes,
    underReview: disputes.filter((d) => d.status === "under_review").length,
    unresolved: openDisputeRows.length,
    overdueEscrow: overdueEscrow.length,
    needsAdminIntervention: actionItems.filter(
      (a) => a.severity === "critical" || a.severity === "high",
    ).length,
    highPriorityDisputes: openDisputeRows.filter((d) => d.amount >= 5000).length,
    incompleteEvidence: incompleteEvidence.length,
    items: (
      [
        canDisputes
          ? {
              label: "النزاعات المفتوحة",
              count: openDisputes,
              severity: severityForCount(openDisputes, 5, 2),
              href: "/admin/disputes?status=open",
            }
          : null,
        canDisputes
          ? {
              label: "النزاعات قيد المراجعة",
              count: disputes.filter((d) => d.status === "under_review").length,
              severity: "high" as Severity,
              href: "/admin/disputes?status=under_review",
            }
          : null,
        canPayments
          ? {
              label: "حالات مضمون تجاوزت المدة",
              count: overdueEscrow.length,
              severity: (overdueEscrow.length > 0 ? "critical" : "low") as Severity,
              href: "/admin/escrow",
            }
          : null,
        canOrders
          ? {
              label: "Evidence ناقص",
              count: incompleteEvidence.length,
              severity: severityForCount(incompleteEvidence.length, 5, 2),
              href: "/admin/orders",
            }
          : null,
        canUsers
          ? {
              label: "حسابات موقوفة",
              count: suspendedUsers.length,
              severity: severityForCount(suspendedUsers.length, 10, 3),
              href: "/admin/users?status=suspended",
            }
          : null,
      ] as Array<{
        label: string;
        count: number;
        severity: Severity;
        href: string;
      } | null>
    ).filter(
      (
        row,
      ): row is {
        label: string;
        count: number;
        severity: Severity;
        href: string;
      } => row != null,
    ),
  };

  const recentActivity = [
    ...audit.slice(0, 12).map((row) => ({
      id: `audit-${row.id}`,
      event: row.action || "إجراء إداري",
      actor: row.actorName || "Admin",
      timestamp: row.createdAt,
      href: "/admin/audit",
    })),
    ...events.slice(0, 8).map((event) => ({
      id: `pay-${event.id}`,
      event: event.type,
      actor: "النظام",
      timestamp: event.createdAt,
      href: event.orderId ? `/admin/orders` : "/admin/stripe",
    })),
  ]
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 12);

  const shortcuts = (
    [
      canListings ? { href: "/admin/listings", label: "مراجعة الإعلانات" } : null,
      canUsers ? { href: "/admin/users", label: "إدارة المستخدمين" } : null,
      canDisputes ? { href: "/admin/disputes", label: "النزاعات" } : null,
      canPayments ? { href: "/admin/escrow", label: "مضمون" } : null,
      canCategories ? { href: "/admin/categories", label: "الأقسام" } : null,
      canPayments ? { href: "/admin/stripe", label: "المدفوعات" } : null,
      canReports ? { href: "/admin/reports", label: "التقارير" } : null,
    ] as Array<{ href: string; label: string } | null>
  ).filter((row): row is { href: string; label: string } => row != null);

  const stripeConfigured = isStripeConfigured();

  return {
    rangeDays,
    generatedAt: new Date().toISOString(),
    permissions: {
      payments: canPayments,
      listings: canListings,
      users: canUsers,
      disputes: canDisputes,
      orders: canOrders,
      reports: canReports,
      categories: canCategories,
    },
    executive,
    platform: canListings || canUsers
      ? {
          totalListings: listingStats.totalListings,
          activeListings: listingStats.activeListings,
          pendingListings: listingStats.pendingListings,
          rejectedListings,
          totalUsers: users.length,
          newUsers,
          totalViews: canListings ? totalViews : null,
          engagement: canListings ? totalFavorites : null,
          topCategories: canListings || canCategories ? categoryPerf.slice(0, 6) : [],
          topListings: canListings ? topListings : [],
        }
      : null,
    financial: canPayments
      ? stripeConfigured || isMockCheckoutAllowed()
        ? {
            available: true as const,
            transactionVolume: volume,
            revenue: fees,
            netProfit: fees,
            heldEscrowAmount: heldAmount,
            heldEscrowCount: heldEscrow.length,
            walletHeld,
            successfulPayments: paid.length,
            pendingPayments: pendingPayments.length,
            refundedAmount,
            refundedCount: refunded.length,
            currency: "AED",
          }
        : {
            available: false as const,
            message: "بيانات الدفع غير متاحة — Stripe غير مفعّل",
          }
      : null,
    operations: {
      queues: operationsQueues,
    },
    risk,
    actionCenter: actionItems,
    trends: {
      daily: buildDailySeries(orders, rangeDays),
      orderStatuses: canOrders ? buildOrderStatusSlices(orders) : [],
      paymentStatuses: canPayments ? buildPaymentStatusSlices(orders) : [],
    },
    categoryPerformance: canListings || canCategories ? categoryPerf : [],
    topListings: canListings ? topListings : [],
    recentActivity,
    shortcuts,
    stripe: {
      configured: stripeConfigured,
      publishableConfigured: Boolean(getStripePublishableKey()),
      webhookConfigured: Boolean(getStripeWebhookSecret()),
      currency: getStripeCurrency(),
      mockAllowed: isMockCheckoutAllowed(),
      dashboardUrl: settings.stripeDashboardUrl,
    },
    settings: {
      maintenanceMode: settings.maintenanceMode,
      platformFeePercent: settings.platformFeePercent,
      escrowHoldDays: settings.escrowHoldDays,
    },
    // Backward-compatible fields for any residual consumers
    kpis: {
      totalOrders: orders.length,
      paidOrders: paid.length,
      refundedOrders: refunded.length,
      heldEscrow: heldEscrow.length,
      volume,
      fees,
      currency: "AED",
      recentEvents: events.length,
      pendingListings: listingStats.pendingListings,
      openDisputes,
      totalUsers: users.length,
      totalListings: listings.length,
      walletAccounts: wallets.length,
      walletAvailable: wallets.reduce((s, w) => s + w.availableBalance, 0),
      walletHeld,
      conversionRate:
        orders.length === 0 ? 0 : Math.round((paid.length / orders.length) * 100),
      activeListings: listingStats.activeListings,
      newUsers,
      rejectedListings,
      totalViews,
      totalFavorites,
      heldAmount,
    },
    notifications: {
      unread: notifications.filter((n) => !n.read).length,
      total: notifications.length,
    },
  };
}

export { parseRange };
