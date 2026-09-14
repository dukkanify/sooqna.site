import { findUserById } from "@/services/auth/user-store";
import {
  isBuyAgainMutationKind,
  resolveBuyAgainAction,
  type BuyAgainDecision,
} from "@/services/payments/buy-again-action";
import {
  getServerListingById,
  getServerListingBySlug,
  hydrateListingCatalog,
} from "@/services/payments/listing-resolver";
import {
  completeMockPayment,
  resumePendingCheckoutForBuyer,
} from "@/services/payments/order-service";
import {
  findPendingOrder,
  getOrderById,
} from "@/services/payments/order-store";
import {
  ensureStripeConfigLoaded,
  isMockCheckoutAllowed,
  isStripeConfigured,
} from "@/services/payments/payment-config";
import {
  isPurchasableListing,
  listingMeetsPurchaseRules,
} from "@/shared/listings/purchase-eligibility";
import type { Order } from "@/types/domain/order";
import type { CheckoutSessionResult } from "@/types/domain/payment";

const buyAgainLocks = new Map<string, Promise<unknown>>();

async function withBuyAgainLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = buyAgainLocks.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const pending = fn().finally(() => {
    buyAgainLocks.delete(key);
  });
  buyAgainLocks.set(key, pending);
  return pending;
}

async function sellerCanCurrentlySell(sellerId: string): Promise<boolean> {
  if (!sellerId) return false;
  const seller = await findUserById(sellerId);
  // Catalog/mock sellers may not have an auth_users row.
  if (!seller) return true;
  return seller.accountStatus !== "suspended";
}

function checkoutIsConfigured(): boolean {
  return isStripeConfigured() || isMockCheckoutAllowed();
}

export async function evaluateBuyAgainForOrder(
  order: Order,
  viewerId: string,
): Promise<BuyAgainDecision> {
  await hydrateListingCatalog();
  await ensureStripeConfigLoaded();

  const listing =
    getServerListingById(order.listingId) ??
    (order.listingSlug ? getServerListingBySlug(order.listingSlug) : undefined) ??
    null;

  const pending = viewerId
    ? await findPendingOrder(viewerId, order.listingId)
    : undefined;

  const listingPurchasable = listing
    ? listingMeetsPurchaseRules(listing) &&
      (isPurchasableListing(listing) || isMockCheckoutAllowed())
    : false;

  return resolveBuyAgainAction({
    order,
    viewerId,
    listing,
    listingDeleted: !listing,
    sellerCanSell: await sellerCanCurrentlySell(
      listing?.seller?.id ?? order.sellerId,
    ),
    checkoutConfigured: checkoutIsConfigured() && listingPurchasable,
    checkoutSessionOpen: null,
    pendingOrderIdForListing:
      pending && pending.id !== order.id ? pending.id : undefined,
  });
}

export async function executeBuyAgainAction(input: {
  orderId: string;
  buyerId: string;
  idempotencyKey?: string;
}): Promise<{
  decision: BuyAgainDecision;
  result?: CheckoutSessionResult & {
    redirectUrl?: string;
    guestAccessToken?: string;
    hasExistingAccount?: boolean;
  };
}> {
  const lockKey = `${input.buyerId}:${input.orderId}:${input.idempotencyKey ?? "buy-again"}`;
  return withBuyAgainLock(lockKey, async () => {
    const order = await getOrderById(input.orderId);
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }
    if (!order.buyerId || order.buyerId !== input.buyerId) {
      throw new Error("FORBIDDEN");
    }

    const decision = await evaluateBuyAgainForOrder(order, input.buyerId);
    if (!isBuyAgainMutationKind(decision.kind)) {
      return { decision };
    }

    if (decision.kind === "complete_payment" || decision.kind === "retry_payment") {
      const resumeId = decision.resumeOrderId ?? order.id;
      const result = await resumePendingCheckoutForBuyer(resumeId, input.buyerId);
      if (result.mode === "mock") {
        const payment = await completeMockPayment(result.orderId);
        const params = new URLSearchParams({ orderId: result.orderId });
        if (payment.guestAccessToken) {
          params.set("token", payment.guestAccessToken);
        }
        return {
          decision,
          result: {
            ...result,
            redirectUrl: `/checkout/success?${params.toString()}`,
            guestAccessToken: payment.guestAccessToken,
            hasExistingAccount: payment.hasExistingAccount,
          },
        };
      }
      return { decision, result };
    }

    // buy_again / repurchase: checkout wizard re-reads current listing
    // price/shipping/seller, then createOrder via initiateCheckout.
    return { decision };
  });
}
