# Sooqna — Known Limitations

**Status:** Public launch ready in this codebase for core flows; full spreadsheet remediation is **not** complete.

Product flows (register, listings, checkout, orders, disputes, admin, support, emails) are implemented. Remaining items are infrastructure, ops secrets, and unfinished P1/P2.

## Production keys (required for full live)

| Need | Variable | If missing |
|------|----------|------------|
| Card payments | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout cannot charge; mock pay is blocked in production |
| Emails | `RESEND_API_KEY`, verified `EMAIL_FROM_ADDRESS=no-reply@sooqna.site` | In-app notifications still work; Resend mail is logged as failed |
| Canonical URLs | `NEXT_PUBLIC_APP_URL=https://sooqna.site` | Email links may point at localhost |
| Session HMAC | `SESSION_SECRET` (or `NEXTAUTH_SECRET`) | Weak/default signing if unset |
| Dispute cron | `CRON_SECRET` + Vercel Cron (`vercel.json` hourly → `/api/cron/dispute-reminders`) | Without secret Production returns `CRON_SECRET_REQUIRED` (fail-closed) |

See [STRIPE_GO_LIVE.md](./STRIPE_GO_LIVE.md).

## Technical limits

| Area | Limitation |
|------|------------|
| **Data storage** | Users/OTP/notifications/listings/orders/disputes/evidence prefer Postgres. Wallets, favorites, chat, and admin settings use durable collections (Postgres or `.data` files). |
| **Sessions** | Signed HMAC session cookies (`SESSION_SECRET` / `NEXTAUTH_SECRET`). Client cannot forge profiles via `/api/auth/session`. |
| **Seller payouts** | Connect Transfer on release when seller Express is ACTIVE. Skipped payouts retry via daily `/api/cron/escrow-maintenance`. `ENABLE_STRIPE_CONNECT_PAYOUTS=false` forces ledger-only. |
| **Escrow evidence** | Uploads via `/api/uploads` to durable local `/api/media` (or S3 when configured). Metadata prefers Postgres. |
| **Images** | Prefer `/api/uploads`; listings fall back to client compression if upload fails. |
| **RBAC** | Module-level flags (not full View/Add/Edit/Delete/Approve/Export matrix). Super Admin empty permissions; Sub Admin assigned modules; Save Permissions required. |
| **UAE PASS** | Hidden until `NEXT_PUBLIC_ENABLE_UAE_PASS=true` |
| **Auto-release** | Daily `/api/cron/escrow-maintenance` after `escrowHoldDays` once seller proof exists (needs `CRON_SECRET` in production). |
| **Automated tests** | `npm test` covers auth, integrity, filters, buy-again, escrow auto-release eligibility. No Playwright E2E yet. |

## Production redeploy note (2026-08-27)

After changing Vercel Production env vars for project **sooqna** (e.g. `CRON_SECRET`), Production must be redeployed so https://sooqna.site picks up the new runtime. Env var edits alone do not update the active deployment.
