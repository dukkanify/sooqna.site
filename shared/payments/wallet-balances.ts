export type WalletBalances = {
  availableBalance: number;
  pendingBalance: number;
  heldInEscrow: number;
};

type LedgerEntry = {
  id: string;
  date: string;
  type: string;
  amount: number;
};

/**
 * Buyer already paid the platform fee in Stripe Checkout; treasury records
 * platform revenue. Seller cash is only escrow hold/release, deposits, and
 * withdrawals — never a negative available fee at capture.
 */
export function applyWalletLedgerEffect(
  balances: WalletBalances,
  transaction: Pick<LedgerEntry, "type" | "amount">,
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
      balances.availableBalance += transaction.amount;
      break;
    case "platform_fee":
      break;
    default:
      break;
  }
}

export function projectWalletBalances(
  transactions: LedgerEntry[],
): WalletBalances {
  const balances: WalletBalances = {
    availableBalance: 0,
    pendingBalance: 0,
    heldInEscrow: 0,
  };
  const chronological = [...transactions].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) return byDate;
    return left.id.localeCompare(right.id);
  });
  for (const transaction of chronological) {
    applyWalletLedgerEffect(balances, transaction);
  }
  return balances;
}
