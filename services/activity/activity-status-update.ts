import { logAdminAction } from "@/services/admin/admin-audit-store";
import {
  notifyJobStatusChange,
  notifyQuoteStatusChange,
  notifyViewingStatusChange,
} from "@/services/activity/activity-status-notify";
import {
  getAllJobApplications,
  updateJobApplicationStatus,
} from "@/services/job-applications/job-application-store";
import {
  getAllQuoteRequests,
  updateQuoteRequestStatus,
} from "@/services/quote-requests/quote-request-store";
import {
  getAllViewingBookings,
  proposeViewingModification,
  updateViewingBookingStatus,
} from "@/services/viewing-bookings/viewing-booking-store";
import type { ActivityKind } from "@/types/domain/activity";
import type { JobApplication } from "@/types/domain/job-application";
import type { QuoteRequest } from "@/types/domain/quote-request";
import type { ViewingBookingStatus } from "@/types/domain/viewing-booking";

const JOB_STATUSES: JobApplication["status"][] = [
  "submitted",
  "viewed",
  "reviewed",
  "shortlisted",
  "accepted",
  "rejected",
];

const VIEWING_STATUSES: ViewingBookingStatus[] = [
  "pending",
  "confirmed",
  "modification_proposed",
  "cancelled",
  "completed",
];

const QUOTE_STATUSES: QuoteRequest["status"][] = [
  "submitted",
  "quoted",
  "accepted",
  "rejected",
  "completed",
];

export type ActivityStatusUpdateInput = {
  kind: ActivityKind;
  id: string;
  status: string;
  actorId: string;
  actorName: string;
  actorRole: "admin" | "seller" | "user";
  proposedDate?: string;
  proposedTime?: string;
  proposedNote?: string;
};

function canManageJob(application: JobApplication, actorId: string, role: string): boolean {
  if (role === "admin") return true;
  return application.employerId === actorId;
}

function canManageQuote(request: QuoteRequest, actorId: string, role: string): boolean {
  if (role === "admin") return true;
  return request.providerId === actorId;
}

export async function updateActivityStatus(input: ActivityStatusUpdateInput) {
  if (input.kind === "job_application") {
    if (!JOB_STATUSES.includes(input.status as JobApplication["status"])) {
      throw new Error("INVALID_STATUS");
    }
    const all = await getAllJobApplications();
    const current = all.find((item) => item.id === input.id);
    if (!current) throw new Error("NOT_FOUND");
    if (!canManageJob(current, input.actorId, input.actorRole)) throw new Error("FORBIDDEN");
    const previous = current.status;
    const nextStatus =
      input.status === "viewed" ? "viewed" : (input.status as JobApplication["status"]);
    const updated = await updateJobApplicationStatus(input.id, nextStatus);
    if (!updated) throw new Error("NOT_FOUND");
    await notifyJobStatusChange(updated, previous);
    if (input.actorRole === "admin") {
      await logAdminAction({
        actorId: input.actorId,
        actorName: input.actorName,
        action: "job_status",
        targetType: "job_application",
        targetId: input.id,
        detail: `الحالة → ${updated.status}`,
      });
    }
    return updated;
  }

  if (input.kind === "viewing_booking") {
    if (!VIEWING_STATUSES.includes(input.status as ViewingBookingStatus)) {
      throw new Error("INVALID_STATUS");
    }
    const all = await getAllViewingBookings();
    const current = all.find((item) => item.id === input.id);
    if (!current) throw new Error("NOT_FOUND");

    const isSeller =
      input.actorRole === "admin" || current.sellerId === input.actorId;
    const isBuyer = current.buyerId === input.actorId;
    if (!isSeller && !isBuyer) throw new Error("FORBIDDEN");

    const nextStatus = input.status as ViewingBookingStatus;

    // Seller proposes a new slot.
    if (nextStatus === "modification_proposed") {
      if (!isSeller) throw new Error("FORBIDDEN");
      if (!input.proposedDate?.trim() || !input.proposedTime?.trim()) {
        throw new Error("INVALID_PROPOSAL");
      }
      const previous = current.status;
      const updated = await proposeViewingModification({
        id: input.id,
        proposedDate: input.proposedDate.trim(),
        proposedTime: input.proposedTime.trim(),
        proposedNote: input.proposedNote,
        proposedBy: input.actorRole === "admin" ? "admin" : "seller",
      });
      if (!updated) throw new Error("NOT_FOUND");
      await notifyViewingStatusChange(updated, previous);
      return updated;
    }

    // Buyer may confirm a proposed modification or cancel their request.
    if (!isSeller) {
      const buyerAllowed =
        (nextStatus === "confirmed" && current.status === "modification_proposed") ||
        (nextStatus === "cancelled" &&
          (current.status === "pending" ||
            current.status === "modification_proposed" ||
            current.status === "confirmed"));
      if (!buyerAllowed) throw new Error("FORBIDDEN");
    }

    const previous = current.status;
    const updated = await updateViewingBookingStatus(input.id, nextStatus);
    if (!updated) throw new Error("NOT_FOUND");
    await notifyViewingStatusChange(updated, previous);
    if (input.actorRole === "admin") {
      await logAdminAction({
        actorId: input.actorId,
        actorName: input.actorName,
        action: "viewing_status",
        targetType: "viewing_booking",
        targetId: input.id,
        detail: `الحالة → ${updated.status}`,
      });
    }
    return updated;
  }

  if (input.kind === "quote_request" || input.kind === "service_booking") {
    if (!QUOTE_STATUSES.includes(input.status as QuoteRequest["status"])) {
      throw new Error("INVALID_STATUS");
    }
    const all = await getAllQuoteRequests();
    const current = all.find((item) => item.id === input.id);
    if (!current) throw new Error("NOT_FOUND");
    if (!canManageQuote(current, input.actorId, input.actorRole)) throw new Error("FORBIDDEN");
    const previous = current.status;
    const updated = await updateQuoteRequestStatus(
      input.id,
      input.status as QuoteRequest["status"],
    );
    if (!updated) throw new Error("NOT_FOUND");
    await notifyQuoteStatusChange(updated, previous);
    if (input.actorRole === "admin") {
      await logAdminAction({
        actorId: input.actorId,
        actorName: input.actorName,
        action: "quote_status",
        targetType: "quote_request",
        targetId: input.id,
        detail: `الحالة → ${updated.status}`,
      });
    }
    return updated;
  }

  throw new Error("UNSUPPORTED_KIND");
}
