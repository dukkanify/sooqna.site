# Sooqna — Escrow Payment Model

## Important Disclaimer

**Stripe is not an escrow provider.** Sooqna:

1. Collects payment via Stripe Checkout into the **platform Stripe account**
2. Tracks held amounts in an **internal escrow ledger**
3. Releases funds when the buyer confirms receipt (or admin force-release)
4. When the seller has an **ACTIVE** Stripe Connect Express account with payouts enabled, creates a **Connect Transfer** of `productPrice` to that account (idempotent per order)
5. If Connect is missing or disabled, release stays **ledger-only** (`connectPayoutSkipReason` recorded) — release never hard-fails solely because the seller is not connected

Disable Connect transfers with `ENABLE_STRIPE_CONNECT_PAYOUTS=false` (ledger-only emergency / demo).

## Release model

```
Buyer pays via Stripe
        ↓
Platform Stripe account receives funds
        ↓
Internal ledger: escrow_status = held
        ↓
Seller wallet: pendingBalance += productPrice
        ↓
Buyer confirms received
        ↓
Internal ledger: escrow_status = released
        ↓
If seller Connect ACTIVE + payouts enabled:
  Stripe Transfer → seller Express account
  Wallet: pending → available, then withdrawal offset (already paid via Connect)
Else:
  Wallet: pendingBalance → availableBalance only
```

## Order Statuses

| Status | Meaning |
|--------|---------|
| `pending_payment` | Order created, awaiting Stripe payment |
| `paid_held_in_escrow` | Payment received, funds held internally |
| `delivered` | Seller marked delivery (future workflow) |
| `confirmed` | Buyer confirmed receipt |
| `released` | Funds released to seller available balance |
| `disputed` | Dispute opened (future) |
| `refunded` | Payment refunded via Stripe |

## Escrow Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Order created, no payment yet |
| `held` | Payment received, awaiting buyer confirmation |
| `released` | Buyer confirmed, seller balance updated |
| `refunded` | Funds returned to buyer |

## Wallet Ledger Behavior

### On payment (`paid_held_in_escrow`)

| Field | Change |
|-------|--------|
| Seller `pendingBalance` | + product price |
| Seller `heldInEscrow` | + product price |
| Platform fee | Recorded as negative `platform_fee` transaction |

### On confirm received (`released`)

| Field | Change |
|-------|--------|
| Seller `pendingBalance` | − product price |
| Seller `heldInEscrow` | − product price |
| Seller `availableBalance` | + product price |
| If Connect transfer succeeded | `availableBalance` − product price (`withdrawal` = paid out via Connect) |
| Order | `stripeTransferId` set, or `connectPayoutSkipReason` when skipped |

### On refund

| Field | Change |
|-------|--------|
| Seller `pendingBalance` | − product price (if held) |
| Seller `heldInEscrow` | − product price |
| Stripe | Refund issued to buyer's card |
| If Connect transfer existed | Transfer reversal attempted before PI refund |

## Stripe Metadata

Every Checkout Session includes:

```json
{
  "orderId": "ord-...",
  "listingId": "...",
  "buyerId": "...",
  "sellerId": "...",
  "platform": "sooqna",
  "escrow": "true"
}
```

## Fee Structure

| Fee | Paid by | Destination |
|-----|---------|-------------|
| Product price | Buyer | Held for seller (escrow) |
| Gateway fee (2.9% + 1 AED) | Buyer | Stripe |
| Platform fee (2.5%) | Buyer | Platform revenue |

## What Buyers See

1. Checkout page with itemized fees
2. Stripe hosted payment page
3. Order detail with escrow status
4. "تأكيد الاستلام" button when payment is held

## What Sellers See

1. Wallet pending balance increases on payment
2. Notification: "دفعة جديدة محجوزة"
3. `/wallet` — Connect onboarding card («ربط حساب الاستلام») for Express payouts
4. After buyer confirms: Connect transfer when linked, otherwise available balance only
5. Notification: "تم تحويل المبلغ"

## What Admins See

- `/admin/orders` — all orders with Stripe PaymentIntent IDs
- `/admin/escrow` — active holds and protected totals
- `/admin/reports` — payment volume and event audit log
- `/admin/stripe` — platform Connect tooling
- Manual refund action per order (reverses Connect transfer when present)

## Remaining gaps

| Gap | Notes |
|-----|-------|
| Connect eligibility | Purchasable goods categories only (`isPurchasableCategory`) — not cars/real-estate/jobs |
| Delivery workflow | Seller proof + buyer confirm + daily auto-release after `escrowHoldDays` |
| Dispute resolution | Form + admin resolve + file evidence uploads; reminders cron |
| KYC | UAE PASS optional; Connect onboarding is the payout KYC path |
| Platform fund segregation | Separate Stripe balance / treasury still optional |
| Object storage | Local durable `/api/media` by default; optional S3 via env |

## Compliance Note

Marketplace escrow regulations vary by jurisdiction. Live card charging and Connect transfers require configured Stripe keys and legal review of fund holding and payout obligations in the UAE.
