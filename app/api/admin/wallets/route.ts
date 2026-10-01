import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { loadAdminWalletsPayload } from "@/services/admin/admin-wallet-metrics";
import { addWalletTransaction } from "@/services/payments/wallet-ledger";
import type { WalletTransactionType } from "@/types/domain/wallet";

export async function GET() {
  const admin = await requireAdminPermission("payments", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const payload = await loadAdminWalletsPayload();
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const admin = await requireAdminPermission("payments", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const body = (await request.json()) as {
    userId?: string;
    amount?: number;
    type?: "deposit" | "withdrawal";
    description?: string;
  };

  const userId = body.userId?.trim();
  const amount = Number(body.amount);
  const type = body.type;

  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  if (type !== "deposit" && type !== "withdrawal") {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }

  const signedAmount =
    type === "withdrawal" ? -Math.abs(amount) : Math.abs(amount);
  const txnType: WalletTransactionType = type;

  const account = await addWalletTransaction(userId, {
    type: txnType,
    amount: signedAmount,
    description:
      body.description?.trim() ||
      (type === "deposit" ? "إيداع إداري" : "سحب إداري"),
    status: "completed",
  });

  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "wallet_adjust",
    targetType: "wallet",
    targetId: userId,
    detail: `${type === "deposit" ? "إيداع" : "سحب"} ${Math.abs(signedAmount)} د.إ`,
  });

  const payload = await loadAdminWalletsPayload();
  return NextResponse.json({
    account: {
      userId: account.userId,
      availableBalance: account.availableBalance,
      pendingBalance: account.pendingBalance,
      heldInEscrow: account.heldInEscrow,
      currency: account.currency,
      transactionsCount: account.transactions.length,
      lastTransaction: account.transactions[0] ?? null,
    },
    ...payload,
  });
}
