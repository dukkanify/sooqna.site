/**
 * Admin wallet desk — real ledger totals only.
 * Drops demo/QA users, empty auto-created wallets, and transactions tied to
 * non-live/seed orders so KPIs match finance desks (filterRealOrders).
 */
import type { Order } from "@/types/domain/order";
import type { WalletAccount, WalletTransaction } from "@/types/domain/wallet";
import { isNonLiveOpsOrder } from "@/services/admin/admin-finance-metrics";
import { BLOCKED_USER_IDS } from "@/services/admin/qa-isolated-cleanup";
import { getAllOrders } from "@/services/payments/order-store";
import { getAllWalletAccounts } from "@/services/payments/wallet-ledger";
import { getAllUsers } from "@/services/auth/user-store";
import type { StoredUser } from "@/types/domain/user";

const DEMO_EMAIL_SUFFIXES = ["@sooqna.demo", "@uaesales.demo"] as const;

const BLOCKED_USER_ID_SET = new Set<string>(BLOCKED_USER_IDS);

export type AdminWalletRow = {
  availableBalance: number;
  currency: "AED";
  email?: string;
  fullName?: string;
  heldInEscrow: number;
  lastTransaction: WalletTransaction | null;
  pendingBalance: number;
  realTransactionsCount: number;
  transactionsCount: number;
  userId: string;
};

export type AdminWalletsPayload = {
  summary: {
    accounts: number;
    available: number;
    currency: "AED";
    held: number;
    pending: number;
  };
  wallets: AdminWalletRow[];
};

export function isDemoWalletUserId(userId: string): boolean {
  const id = userId.trim().toLowerCase();
  if (!id) return true;
  if (BLOCKED_USER_ID_SET.has(userId) || BLOCKED_USER_ID_SET.has(id)) return true;
  if (id.startsWith("demo-")) return true;
  if (id.startsWith("qa-") || id.startsWith("qa_")) return true;
  return false;
}

export function isDemoWalletUser(user?: Pick<StoredUser, "email" | "id" | "registrationSource"> | null): boolean {
  if (!user) return false;
  if (isDemoWalletUserId(user.id)) return true;
  if (user.registrationSource === "DEMO") return true;
  const email = (user.email || "").trim().toLowerCase();
  return DEMO_EMAIL_SUFFIXES.some((suffix) => email.endsWith(suffix));
}

function applyWalletTransaction(
  balances: {
    availableBalance: number;
    heldInEscrow: number;
    pendingBalance: number;
  },
  transaction: WalletTransaction,
): void {
  switch (transaction.type) {
    case "escrow_hold":
      balances.pendingBalance += transaction.amount;
      balances.heldInEscrow += transaction.amount;
      break;
    case "escrow_release":
      balances.pendingBalance = Math.max(
        0,
        balances.pendingBalance - transaction.amount,
      );
      balances.heldInEscrow = Math.max(
        0,
        balances.heldInEscrow - transaction.amount,
      );
      balances.availableBalance += transaction.amount;
      break;
    case "refund":
      balances.pendingBalance = Math.max(
        0,
        balances.pendingBalance - Math.abs(transaction.amount),
      );
      balances.heldInEscrow = Math.max(
        0,
        balances.heldInEscrow - Math.abs(transaction.amount),
      );
      break;
    case "deposit":
    case "stripe_payment":
    case "withdrawal":
    case "platform_fee":
      balances.availableBalance += transaction.amount;
      break;
    default:
      break;
  }
}

/** Replay ledger excluding mock-order rows (oldest → newest). */
export function projectRealWalletBalances(
  account: WalletAccount,
  mockOrderIds: Set<string>,
): {
  availableBalance: number;
  heldInEscrow: number;
  pendingBalance: number;
  realTransactions: WalletTransaction[];
} {
  const realTransactions = [...account.transactions]
    .filter((txn) => !txn.orderId || !mockOrderIds.has(txn.orderId))
    .reverse();

  const balances = {
    availableBalance: 0,
    pendingBalance: 0,
    heldInEscrow: 0,
  };
  for (const txn of realTransactions) {
    applyWalletTransaction(balances, txn);
  }

  return {
    ...balances,
    realTransactions: realTransactions.reverse(),
  };
}

export function filterRealWalletAccounts(
  wallets: WalletAccount[],
  options: {
    mockOrderIds: Set<string>;
    usersById: Map<string, StoredUser>;
  },
): AdminWalletRow[] {
  const rows: AdminWalletRow[] = [];

  for (const wallet of wallets) {
    const user = options.usersById.get(wallet.userId);
    if (isDemoWalletUserId(wallet.userId) || isDemoWalletUser(user)) {
      continue;
    }

    const projected = projectRealWalletBalances(wallet, options.mockOrderIds);
    const hasActivity =
      projected.realTransactions.length > 0 ||
      projected.availableBalance !== 0 ||
      projected.pendingBalance !== 0 ||
      projected.heldInEscrow !== 0;
    if (!hasActivity) continue;

    rows.push({
      userId: wallet.userId,
      fullName: user?.fullName?.trim() || undefined,
      email: user?.email?.trim() || undefined,
      availableBalance: projected.availableBalance,
      pendingBalance: projected.pendingBalance,
      heldInEscrow: projected.heldInEscrow,
      currency: "AED",
      transactionsCount: projected.realTransactions.length,
      realTransactionsCount: projected.realTransactions.length,
      lastTransaction: projected.realTransactions[0] ?? null,
    });
  }

  rows.sort((a, b) => {
    const aDate = a.lastTransaction?.date ?? "";
    const bDate = b.lastTransaction?.date ?? "";
    return bDate.localeCompare(aDate);
  });

  return rows;
}

export function summarizeAdminWallets(wallets: AdminWalletRow[]) {
  return {
    accounts: wallets.length,
    available: wallets.reduce((sum, w) => sum + w.availableBalance, 0),
    pending: wallets.reduce((sum, w) => sum + w.pendingBalance, 0),
    held: wallets.reduce((sum, w) => sum + w.heldInEscrow, 0),
    currency: "AED" as const,
  };
}

export async function loadAdminWalletsPayload(): Promise<AdminWalletsPayload> {
  const [wallets, orders, users] = await Promise.all([
    getAllWalletAccounts(),
    getAllOrders(),
    getAllUsers(),
  ]);

  const mockOrderIds = new Set(
    orders.filter((order) => isNonLiveOpsOrder(order)).map((order) => order.id),
  );
  const usersById = new Map(users.map((user) => [user.id, user]));
  const rows = filterRealWalletAccounts(wallets, { mockOrderIds, usersById });

  return {
    summary: summarizeAdminWallets(rows),
    wallets: rows,
  };
}

/** Non-live / seed order id set for callers that already loaded orders. */
export function mockOrderIdSet(orders: Order[]): Set<string> {
  return new Set(
    orders.filter((order) => isNonLiveOpsOrder(order)).map((o) => o.id),
  );
}
