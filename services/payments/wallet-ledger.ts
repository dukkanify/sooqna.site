import type { WalletAccount, WalletTransaction } from "@/types/domain/wallet";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

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

export async function getWalletAccount(userId: string): Promise<WalletAccount> {
  const wallets = await store.listAll();
  const existing = wallets.find((wallet) => wallet.userId === userId);
  if (existing) return toAccount(existing);

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

  switch (transaction.type) {
    case "escrow_hold":
      record.pendingBalance += transaction.amount;
      record.heldInEscrow += transaction.amount;
      break;
    case "escrow_release":
      record.pendingBalance = Math.max(
        0,
        record.pendingBalance - transaction.amount,
      );
      record.heldInEscrow = Math.max(
        0,
        record.heldInEscrow - transaction.amount,
      );
      record.availableBalance += transaction.amount;
      break;
    case "refund":
      record.pendingBalance = Math.max(
        0,
        record.pendingBalance - Math.abs(transaction.amount),
      );
      record.heldInEscrow = Math.max(
        0,
        record.heldInEscrow - Math.abs(transaction.amount),
      );
      break;
    case "deposit":
    case "stripe_payment":
      record.availableBalance += transaction.amount;
      break;
    case "withdrawal":
    case "platform_fee":
      record.availableBalance += transaction.amount;
      break;
    default:
      break;
  }

  record.id = userId;
  await store.upsert(record);
  return toAccount(record);
}

export async function getAllWalletAccounts(): Promise<WalletAccount[]> {
  const wallets = await store.listAll();
  return wallets.map(toAccount);
}
