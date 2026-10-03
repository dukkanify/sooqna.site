import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { NextResponse } from "next/server";
import { getEmailLogs } from "@/services/email/email-log-store";
import { getAllNotifications } from "@/services/payments/notification-store";
import { resolveDisplayMaps } from "@/services/display/resolve-display-labels";
import {
  emailEventTypeLabel,
  notificationTypeLabel,
} from "@/shared/display/event-type-labels";
import { humanDisplayLabel } from "@/shared/display/technical-id";
import { listingKeyFromHref } from "@/shared/listings/listing-url";

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }

  const notifications = await getAllNotifications();
  const emailLogs = await getEmailLogs();
  const cappedNotifications = notifications.slice(0, 100);
  const cappedEmails = emailLogs.slice(0, 80);

  const { users, listings } = await resolveDisplayMaps({
    userIds: [
      ...cappedNotifications.map((item) => item.userId),
      ...cappedEmails.map((item) => item.userId),
    ],
    listingIds: [
      ...cappedNotifications.map((item) => listingKeyFromHref(item.href)),
      ...cappedEmails.map((item) => item.entityId),
    ],
  });

  return NextResponse.json({
    summary: {
      total: notifications.length,
      unread: notifications.filter((item) => !item.read).length,
      emailsSent: emailLogs.filter((item) => item.status === "sent").length,
      emailsFailed: emailLogs.filter((item) => item.status === "failed").length,
      emailsPending: emailLogs.filter((item) => item.status === "pending").length,
    },
    notifications: cappedNotifications.map((item) => {
      const user = users.get(item.userId);
      const listingKey = listingKeyFromHref(item.href);
      const listing = listingKey ? listings.get(listingKey) : undefined;
      return {
        ...item,
        title: humanDisplayLabel(item.title, "إشعار"),
        body: humanDisplayLabel(item.body, ""),
        href: item.href || listing?.href,
        userName: user?.name ?? "مستخدم",
        userHref: user?.href,
        userEmail: user?.email,
        typeLabel: notificationTypeLabel(item.type),
        listingTitle: listing?.title,
        listingHref: listing?.href || item.href,
      };
    }),
    emailLogs: cappedEmails.map((item) => {
      const user = item.userId ? users.get(item.userId) : undefined;
      const listing = listings.get(item.entityId);
      return {
        ...item,
        typeLabel: emailEventTypeLabel(item.type),
        entityLabel: listing?.title,
        entityHref: listing?.href,
        userName: user?.name,
        userHref: user?.href,
      };
    }),
  });
}
