import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/services/profile";
import { syncConnectAccountFromStripe } from "@/services/payments/stripe-connect.service";

export default async function WalletStripeReturnPage() {
  const user = await requireCurrentUser("/wallet/stripe/return");
  try {
    await syncConnectAccountFromStripe(user.id);
  } catch {
    // Best-effort sync; wallet card refreshes on the next visit.
  }
  redirect("/wallet?connect=returned");
}
