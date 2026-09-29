import { randomBytes } from "node:crypto";
import type {
  SupportMessage,
  SupportMessageStatus,
  SupportTopic,
} from "@/types/domain/support-message";
import { loadCollection, saveCollection } from "@/services/payments/data-store";

const FILE = "support-messages.json";

export type SupportMessagePatch = {
  status: SupportMessageStatus;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedByName?: string;
};

export async function getAllSupportMessages(): Promise<SupportMessage[]> {
  return loadCollection<SupportMessage>(FILE);
}

export async function getSupportMessageById(
  id: string,
): Promise<SupportMessage | undefined> {
  const all = await loadCollection<SupportMessage>(FILE);
  return all.find((item) => item.id === id);
}

export async function createSupportMessage(input: {
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
}): Promise<SupportMessage> {
  const all = await loadCollection<SupportMessage>(FILE);
  const row: SupportMessage = {
    id: `sup-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    topic: input.topic,
    message: input.message.trim(),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  all.unshift(row);
  await saveCollection(FILE, all);
  return row;
}

export async function patchSupportMessage(
  id: string,
  patch: SupportMessagePatch,
): Promise<SupportMessage | undefined> {
  const all = await loadCollection<SupportMessage>(FILE);
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  all[index] = { ...all[index], ...patch };
  await saveCollection(FILE, all);
  return all[index];
}
