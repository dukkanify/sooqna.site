import type { WalletAccount, WalletTransaction } from "@/types/domain/wallet";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";
import { getOrderById } from "@/services/payments/order-store";
import {
  projectWalletBalances,
} from "@/shared/payments/wallet-balances";

export type { WalletBalances } from "@/shared/payments/wallet-balances";
export { applyWalletLedgerEffect, projectWalletBalances } from "@/shared/payments/wallet-balances";

type WalletRecord = WalletAccount & { id: string };

const store = createPayloadCollectionStore<WalletRecord>({
  table: "marketplace_wallets",
  fileName: "sooqna-wallets.json",
});

function createTransaction(
  input: Omit<WalletTransaction, "id" | "date">,
): WalletTransaction {
  return {
    ...input,
    id: `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  };
}

function toAccount(record: WalletRecord): WalletAccount {
  const { id, ...account } = record;
  void id;
  return account;
}

function emptyAccount(userId: string): WalletRecord {
  return {
    id: userId,
    userId,
    availableBalance: 0,
    pendingBalance: 0,
    heldInEscrow: 0,
    currency: "AED",
    transactions: [],
  };
}

function syncRecordBalances(record: WalletRecord): boolean {
  const projected = projectWalletBalances(record.transactions);
  const drifted =
    record.availableBalance !== projected.availableBalance ||
    record.pendingBalance !== projected.pendingBalance ||
    record.heldInEscrow !== projected.heldInEscrow;
  record.availableBalance = projected.availableBalance;
  record.pendingBalance = projected.pendingBalance;
  record.heldInEscrow = projected.heldInEscrow;
  return drifted;
}

/** Refunds opened from a dispute used to skip the seller unwind. Backfill it. */
async function healRefundedEscrowHolds(record: WalletRecord): Promise<boolean> {
  const refundedIds = new Set(
    record.transactions
      .filter((txn) => txn.type === "refund" && txn.orderId)
      .map((txn) => txn.orderId as string),
  );
  const openHolds = [
    ...new Set(
      record.transactions
        .filter(
          (txn) =>
            txn.type === "escrow_hold" &&
            txn.orderId &&
            !refundedIds.has(txn.orderId),
        )
        .map((txn) => txn.orderId as string),
    ),
  ];
  if (openHolds.length === 0) return false;

  let changed = false;
  for (const orderId of openHolds) {
    const order = await getOrderById(orderId);
    if (!order) continue;
    if (order.status !== "refunded" && order.escrowStatus !== "refunded") {
      continue;
    }
    const amount = Math.abs(Number(order.fees?.productPrice) || 0);
    if (amount <= 0) continue;
    record.transactions.unshift(
      createTransaction({
        userId: record.userId,
        orderId,
        type: "refund",
        amount: -amount,
        description: `استرداد — ${order.listingTitle}`,
        status: "completed",
      }),
    );
    changed = true;
  }
  return changed;
}

export async function getWalletAccount(userId: string): Promise<WalletAccount> {
  const wallets = await store.listAll();
  const existing = wallets.find((wallet) => wallet.userId === userId);
  if (existing) {
    const healed = await healRefundedEscrowHolds(existing);
    if (healed || syncRecordBalances(existing)) {
      await store.upsert(existing);
    }
    return toAccount(existing);
  }

  const created = emptyAccount(userId);
  await store.upsert(created);
  return toAccount(created);
}

export async function addWalletTransaction(
  userId: string,
  transaction: Omit<WalletTransaction, "id" | "date" | "userId">,
): Promise<WalletAccount> {
  const wallets = await store.listAll();
  let record = wallets.find((wallet) => wallet.userId === userId);
  if (!record) {
    record = emptyAccount(userId);
  }

  const entry = createTransaction({ ...transaction, userId });
  record.transactions.unshift(entry);
  syncRecordBalances(record);
  record.id = userId;
  await store.upsert(record);
  return toAccount(record);
}

export async function getAllWalletAccounts(): Promise<WalletAccount[]> {
  const wallets = await store.listAll();
  const next: WalletAccount[] = [];
  for (const record of wallets) {
    const copy: WalletRecord = {
      ...record,
      transactions: [...record.transactions],
    };
    const healed = await healRefundedEscrowHolds(copy);
    const drifted = syncRecordBalances(copy);
    if (healed || drifted) {
      await store.upsert(copy);
    }
    next.push(toAccount(copy));
  }
  return next;
}

/** Replace the full wallet collection (admin purge / migrations). */
export async function replaceAllWalletAccounts(
  accounts: WalletAccount[],
): Promise<void> {
  const records: WalletRecord[] = accounts.map((account) => {
    const record: WalletRecord = {
      ...account,
      id: account.userId,
    };
    syncRecordBalances(record);
    return record;
  });
  await store.replaceAll(records);
}

export async function removeWalletAccount(userId: string): Promise<boolean> {
  return store.removeById(userId);
}
