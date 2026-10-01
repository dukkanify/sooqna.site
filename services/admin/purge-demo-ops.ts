/**
 * One-shot admin cleanup of demo/seed marketplace ops rows that filters hide
 * but leave in Neon (orders, wallets, demo users).
 */
import { isNonLiveOpsOrder } from "@/services/admin/admin-finance-metrics";
import { isDemoWalletUserId } from "@/services/admin/admin-wallet-metrics";
import { getAllOrders, replaceAllOrders } from "@/services/payments/order-store";
import {
  getAllWalletAccounts,
  replaceAllWalletAccounts,
} from "@/services/payments/wallet-ledger";
import {
  deletePersistedUser,
  listPersistedUsers,
} from "@/services/auth/user-persistence";
import type { StoredUser } from "@/types/domain/user";

function isDemoUser(user: StoredUser): boolean {
  const email = (user.email || "").trim().toLowerCase();
  return (
    user.registrationSource === "DEMO" ||
    email.endsWith("@sooqna.demo") ||
    email.endsWith("@uaesales.demo") ||
    isDemoWalletUserId(user.id)
  );
}

export type PurgeDemoOpsResult = {
  removedOrders: number;
  removedWallets: number;
  removedUsers: number;
  remainingOrders: number;
  remainingWallets: number;
};

export async function purgeDemoOpsData(): Promise<PurgeDemoOpsResult> {
  const [orders, wallets, users] = await Promise.all([
    getAllOrders(),
    getAllWalletAccounts(),
    listPersistedUsers(),
  ]);

  const liveOrders = orders.filter((order) => !isNonLiveOpsOrder(order));
  const liveWallets = wallets.filter(
    (wallet) => !isDemoWalletUserId(wallet.userId),
  );
  const demoUsers = users.filter(isDemoUser);

  await replaceAllOrders(liveOrders);
  await replaceAllWalletAccounts(liveWallets);

  let removedUsers = 0;
  for (const user of demoUsers) {
    try {
      await deletePersistedUser(user.id);
      removedUsers += 1;
    } catch {
      // continue — best-effort cleanup
    }
  }

  return {
    removedOrders: orders.length - liveOrders.length,
    removedWallets: wallets.length - liveWallets.length,
    removedUsers,
    remainingOrders: liveOrders.length,
    remainingWallets: liveWallets.length,
  };
}
