import { randomBytes } from "node:crypto";
import type {
  SupportMessage,
  SupportMessageStatus,
  SupportTicketReceipt,
  SupportTopic,
} from "@/types/domain/support-message";
import {
  normalizeSupportMessageStatus,
  SUPPORT_MESSAGE_STATUS_LABELS,
} from "@/types/domain/support-message";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";
import { loadCollection } from "@/services/payments/data-store";

const LEGACY_FILE = "support-messages.json";

type StoredSupportMessage = Omit<SupportMessage, "status" | "ticketNumber"> & {
  status: string;
  ticketNumber?: string;
};

const store = createPayloadCollectionStore<StoredSupportMessage>({
  table: "marketplace_support_messages",
  fileName: "sooqna-support-messages.json",
  orderBySql: "created_at DESC NULLS LAST, updated_at DESC",
});

let migratedLegacy = false;

export type SupportMessagePatch = {
  status: SupportMessageStatus;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedByName?: string;
};

function ticketFromId(id: string, createdAt: string): string {
  const day = (createdAt || "").slice(0, 10).replace(/-/g, "") || "DRAFT";
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "TICK";
  return `SQ-${day}-${tail}`;
}

function normalizeRow(row: StoredSupportMessage): SupportMessage {
  const createdAt = row.createdAt || new Date().toISOString();
  return {
    ...row,
    ticketNumber: row.ticketNumber || ticketFromId(row.id, createdAt),
    status: normalizeSupportMessageStatus(row.status),
    email: (row.email || "").trim().toLowerCase(),
    name: (row.name || "").trim(),
    message: (row.message || "").trim(),
    createdAt,
  };
}

async function ensureLegacyMigrated(): Promise<void> {
  if (migratedLegacy) return;
  migratedLegacy = true;
  try {
    const existing = await store.listAll();
    if (existing.length > 0) return;
    const legacy = await loadCollection<StoredSupportMessage>(LEGACY_FILE);
    if (!legacy.length) return;
    for (const row of legacy) {
      const normalized = normalizeRow(row);
      await store.upsert(normalized);
    }
  } catch {
    // Legacy file may be absent — ignore.
  }
}

export function toSupportTicketReceipt(
  message: SupportMessage,
): SupportTicketReceipt {
  return {
    ticketNumber: message.ticketNumber,
    topic: message.topic,
    status: message.status,
    statusLabel: SUPPORT_MESSAGE_STATUS_LABELS[message.status],
    createdAt: message.createdAt,
    name: message.name,
    email: message.email,
    message: message.message,
    resolutionNote: message.resolutionNote,
    resolvedAt: message.resolvedAt,
  };
}

export async function getAllSupportMessages(): Promise<SupportMessage[]> {
  await ensureLegacyMigrated();
  const rows = await store.listAll();
  return rows
    .map(normalizeRow)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getSupportMessageById(
  id: string,
): Promise<SupportMessage | undefined> {
  const all = await getAllSupportMessages();
  return all.find((item) => item.id === id);
}

export async function getSupportMessageByTicketNumber(
  ticketNumber: string,
): Promise<SupportMessage | undefined> {
  const needle = ticketNumber.trim().toUpperCase();
  if (!needle) return undefined;
  const all = await getAllSupportMessages();
  return all.find((item) => item.ticketNumber.toUpperCase() === needle);
}

export async function getSupportMessagesForUser(
  userId: string,
  email?: string,
): Promise<SupportMessage[]> {
  const all = await getAllSupportMessages();
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  return all.filter(
    (item) =>
      (userId && item.userId === userId) ||
      (normalizedEmail && item.email === normalizedEmail),
  );
}

export async function lookupSupportTicket(input: {
  ticketNumber: string;
  email: string;
}): Promise<SupportTicketReceipt | undefined> {
  const message = await getSupportMessageByTicketNumber(input.ticketNumber);
  if (!message) return undefined;
  if (message.email !== input.email.trim().toLowerCase()) return undefined;
  return toSupportTicketReceipt(message);
}

function nextTicketNumber(createdAt: string): string {
  const day = createdAt.slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `SQ-${day}-${suffix}`;
}

export async function createSupportMessage(input: {
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
  userId?: string;
}): Promise<SupportMessage> {
  await ensureLegacyMigrated();
  const createdAt = new Date().toISOString();
  const id = `sup-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const row: SupportMessage = {
    id,
    ticketNumber: nextTicketNumber(createdAt),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    topic: input.topic,
    message: input.message.trim(),
    status: "received",
    createdAt,
    userId: input.userId,
  };
  await store.upsert(row);
  return row;
}

export async function patchSupportMessage(
  id: string,
  patch: SupportMessagePatch,
): Promise<SupportMessage | undefined> {
  await ensureLegacyMigrated();
  const existing = await getSupportMessageById(id);
  if (!existing) return undefined;
  const next: SupportMessage = {
    ...existing,
    ...patch,
    status: normalizeSupportMessageStatus(patch.status),
  };
  await store.upsert(next);
  return next;
}
