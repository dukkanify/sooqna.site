/**
 * Platform treasury journal — immutable ledger entries for platform-held
 * accounting (escrow liability, seller payable, platform revenue).
 * Balances are derived from entries; never overwrite a balance in place.
 */
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

export type TreasuryAccount =
  | "escrow_liability"
  | "seller_payable"
  | "platform_revenue"
  | "buyer_receivable"
  | "stripe_clearing";

export type TreasuryEntryType =
  | "payment"
  | "fee"
  | "escrow_hold"
  | "release"
  | "refund"
  | "payout"
  | "payout_failed"
  | "payout_retry"
  | "adjustment";

export type TreasuryJournalEntry = {
  id: string;
  transactionId: string;
  reference: string;
  amount: number;
  currency: "AED";
  type: TreasuryEntryType;
  /** Positive = debit, negative = credit on the named account. */
  account: TreasuryAccount;
  amountSigned: number;
  actor: string;
  source: "system" | "admin" | "webhook" | "cron";
  idempotencyKey: string;
  createdAt: string;
  metadata?: Record<string, string>;
};

const store = createPayloadCollectionStore<TreasuryJournalEntry>({
  table: "marketplace_treasury_journal",
  fileName: "sooqna-treasury-journal.json",
});

export async function appendTreasuryEntry(input: {
  transactionId: string;
  reference: string;
  amount: number;
  type: TreasuryEntryType;
  account: TreasuryAccount;
  /** +debit / -credit */
  amountSigned: number;
  actor: string;
  source: TreasuryJournalEntry["source"];
  idempotencyKey: string;
  metadata?: Record<string, string>;
}): Promise<TreasuryJournalEntry> {
  const existing = (await store.listAll()).find(
    (row) => row.idempotencyKey === input.idempotencyKey,
  );
  if (existing) return { ...existing };

  const entry: TreasuryJournalEntry = {
    id: `tj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    transactionId: input.transactionId,
    reference: input.reference,
    amount: Math.abs(input.amount),
    currency: "AED",
    type: input.type,
    account: input.account,
    amountSigned: input.amountSigned,
    actor: input.actor,
    source: input.source,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };
  await store.upsert(entry);
  return { ...entry };
}

export async function getTreasuryBalance(
  account: TreasuryAccount,
): Promise<number> {
  const rows = await store.listAll();
  return rows
    .filter((row) => row.account === account)
    .reduce((sum, row) => sum + row.amountSigned, 0);
}

export async function listTreasuryEntries(filters?: {
  transactionId?: string;
  account?: TreasuryAccount;
}): Promise<TreasuryJournalEntry[]> {
  const rows = await store.listAll();
  return rows
    .filter((row) =>
      filters?.transactionId
        ? row.transactionId === filters.transactionId
        : true,
    )
    .filter((row) =>
      filters?.account ? row.account === filters.account : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
