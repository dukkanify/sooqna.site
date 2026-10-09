# Sooqna — Production Deployment Guide

**Production domain:** [https://sooqnauae.com](https://sooqnauae.com)  
**WWW policy:** `www.sooqnauae.com` → `sooqnauae.com` (308 redirect via middleware)

---

## Prerequisites

- Node.js 20+
- Hosting with HTTPS (Vercel, Railway, etc.)
- DNS access for `sooqnauae.com`
- Stripe live-mode account

---

## Environment Variables

Copy production template:

```bash
cp .env.production.example .env.production
```

| Variable | Production value | Required |
|----------|------------------|----------|
| `NEXT_PUBLIC_APP_URL` | `https://sooqnauae.com` | Yes — set at **build time** |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Yes |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Yes |
| `STRIPE_CURRENCY` | `aed` | Yes |
| `SESSION_COOKIE_DOMAIN` | `.sooqnauae.com` | Recommended |
| `SESSION_SECRET` | long random | **Yes** — HMAC session cookies |
| `CRON_SECRET` | long random | **Yes** — escrow auto-release + dispute reminder crons |
| `OTP_PEPPER` | long random (not the code default) | **Yes** — OTP hashing |
| `PASSWORD_PEPPER` | stable secret | Recommended — set once; rotating invalidates passwords |
| `ALLOW_DEMO_ACCOUNTS` | `false` | **Yes on Vercel** — blocks `@sooqna.demo` seed/login |
| `ALLOW_MOCK_CHECKOUT` | `false` | **Yes on Vercel** |
| `DATABASE_URL` | `postgres://...` (Neon / Vercel Postgres) | **Yes on Vercel** — user accounts must not use `/tmp` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token | **Recommended on Vercel** — durable listing photos (auto-linked when Blob store is connected) |
| `S3_BUCKET` + `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` | AWS / Cloudflare R2 / MinIO | Optional alternative to Blob |
| `S3_PUBLIC_BASE_URL` | CDN / public bucket base | Recommended with S3 |
| `S3_ENDPOINT` / `S3_REGION` | Provider endpoint & region | As required by your provider |

`NEXT_PUBLIC_APP_URL` must be set before `npm run build` so metadata, sitemap, Stripe redirects, and JSON-LD use the correct domain.

### Media durability (listing photos)

- Prefer Vercel Blob (`BLOB_READ_WRITE_TOKEN`) on this project; S3/R2 also works when those credentials are set (S3 wins if both are present).
- With Blob or S3 configured, `/api/uploads` returns stable public object URLs.
- Without object storage on serverless, the client compresses images to data URLs so photos survive inside listing JSON (Postgres) instead of ephemeral `/api/media` disk.
- Set Stripe live keys (`STRIPE_*`) in the Vercel project for real escrow checkout; mock fallback runs only when keys are unset.

---

## Build & Deploy

```bash
npm install
npm run lint
npm run build
npm run start
```

On Vercel / similar: set env vars in the dashboard, then deploy from `main`.

---

## Deploy Hook (Production)

Use a Vercel Deploy Hook when Git auto-deploy is blocked (e.g. rate limit) or you want an explicit production trigger from GitHub Actions.

### 1. Create the hook in Vercel

1. Open [Vercel Dashboard](https://vercel.com) → project **sooqna** (production domain: `sooqnauae.com`)
2. **Settings** → **Git** → **Deploy Hooks**
3. **Create Hook**
   - Name: `production-main`
   - Branch: `main`
4. Copy the generated URL (format: `https://api.vercel.com/v1/integrations/deploy/...`)

### 2. Add GitHub secret

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
   - Name: `VERCEL_DEPLOY_HOOK`
   - Value: paste the Deploy Hook URL from step 1

### 3. Automatic trigger

Workflow `.github/workflows/deploy-production.yml` runs on every push to `main` and calls the hook.

Manual trigger: **Actions** → **Deploy Production** → **Run workflow**.

### 4. Manual curl (optional)

```bash
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy"
```

Expected success response:

```json
{"job":{"id":"...","state":"PENDING","createdAt":...}}
```

> **Note:** Deploy Hooks still count toward your Vercel plan's daily deployment limit. If you see `Deployment rate limited — retry in 24 hours`, wait for the quota to reset or upgrade the plan before the hook can succeed.

---

## DNS Checklist

| Record | Type | Value | Notes |
|--------|------|-------|-------|
| Apex `@` | `A` or `ALIAS` | Hosting provider IP/CNAME | Primary site |
| `www` | `CNAME` | Hosting provider / apex | Middleware redirects to apex |

Verify:

```bash
dig sooqnauae.com
dig www.sooqnauae.com
```

---

## HTTPS

- Middleware enforces HTTPS in production when `x-forwarded-proto` is `http`
- HSTS header: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

---

## Stripe Webhook (Production)

**Endpoint URL:**

```
https://sooqnauae.com/api/webhooks/stripe
```

### Setup steps

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://sooqnauae.com/api/webhooks/stripe`
3. Events (payments + Connect):
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `account.updated`
   - `capability.updated`
   - `transfer.created` / `transfer.failed` (if using Connect payouts)
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`
5. Send test event and confirm `200` response

### Stripe Checkout redirect URLs (automatic)

| Flow | URL |
|------|-----|
| Success | `https://sooqnauae.com/checkout/success?orderId=[id]` |
| Cancel | `https://sooqnauae.com/checkout?listingId=...&payment=cancelled` |

---

## Session Cookies (Production)

Auth sets an HttpOnly cookie alongside `localStorage`:

| Attribute | Value |
|-----------|-------|
| Name | `sooqna_session` |
| Secure | `true` (production) |
| HttpOnly | `true` |
| SameSite | `Lax` |
| Domain | `.sooqnauae.com` |
| Path | `/` |

Cookie is set via `POST /api/auth/session` on login/register and cleared on logout.

---

## Middleware

`middleware.ts` handles:

- `www.sooqnauae.com` → `https://sooqnauae.com` (308)
- HTTP → HTTPS redirect in production
- HSTS response header

---

## Post-Deployment Tests

| # | Test | Expected |
|---|------|----------|
| 1 | Open `https://sooqnauae.com` | Site loads over HTTPS |
| 2 | Open `https://www.sooqnauae.com` | Redirects to apex |
| 3 | View `/sitemap.xml` | URLs use `https://sooqnauae.com` |
| 4 | View page source JSON-LD | Organization URL is `https://sooqnauae.com` |
| 5 | Login as demo user | Session cookie set (`sooqna_session`) |
| 6 | Logout | Cookie cleared |
| 7 | Buy Now → Checkout → Stripe | Redirect URLs use `sooqnauae.com` |
| 8 | Stripe webhook test event | `POST /api/webhooks/stripe` returns 200 |
| 9 | `npm run build` with prod env | No localhost in output metadata |

---

## Local Development

Local dev still uses `http://localhost:3000`:

```bash
cp .env.example .env.local
npm run dev
```

Stripe local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Related Docs

- [DOMAIN_MIGRATION_REPORT.md](./DOMAIN_MIGRATION_REPORT.md)
- [STRIPE_WEBHOOK_SETUP.md](./STRIPE_WEBHOOK_SETUP.md)
- [PAYMENT_FLOW_DOCUMENTATION.md](./PAYMENT_FLOW_DOCUMENTATION.md)
