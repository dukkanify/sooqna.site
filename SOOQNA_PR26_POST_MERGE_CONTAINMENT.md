# SOOQNA — PR #26 Post-Merge Containment & Production Safety Check

**Date:** 2026-09-15 (Cloud)  
**Repo:** dukkanify/sooqna.site  
**PR:** #26  

## Decision state

**B. #26 LIVE — PRODUCTION SMOKE PASS — FULL FINANCIAL CERTIFICATION STILL REQUIRED**

Not claiming PRODUCTION READY.

## Identity

| Field | Value |
|-------|-------|
| ORIGIN_MAIN_SHA |  |
| MAIN_CONTAINS_a494466 | **YES** |
| PRE_26_BASELINE_SHA |  (#25 tip) |
| PR #26 certified Preview source tip |  |
| PR #26 merge/squash SHA |  |

## Production

| Field | Value |
|-------|-------|
| PRODUCTION_SHA |  |
| PRODUCTION_DEPLOYMENT_ID |  |
| Created |  |
| Ready/status | **success** |
| Live dpl on https://sooqna.site |  |
| Matches Production deploy artifact URL | **YES** |
| **#26 LIVE ON PRODUCTION** | **YES** |

## Production smoke (non-destructive)

| Surface | Result |
|---------|--------|
| Homepage | 200 |
| Login | 200 |
| Password reset / forgot | 200 |
| Search (+ filter markers) | 200 |
| Listing detail | 200 () |
| Phone / WhatsApp |  +  present |
| Orders | 200 |
| Admin | 307 →  |
| Notifications | 200 |
| Escrow / Madmoon UI | 200 (ضمان / escrow copy present) |
| Guest session API | 401  |
| Private media guest | 401 UNAUTHORIZED |
| Admin API guest | 401 |
| Cron unauthorized | 503  (fail-closed; secret missing on Prod too) |
| Critical 500 / blank auth regression | **Not observed** |

**PRODUCTION_SMOKE: PASS** (guest/UI only; no real money; no authenticated E2E)

No critical regression found → **no revert PR opened**.

## Preview / ops env (presence only; never print values)

| Item | Status |
|------|--------|
| CRON_SECRET | **MISSING** (Preview **and** Production return 503 ) |
| STRIPE_SECRET_KEY | **UNKNOWN / LIKELY SET** (webhook → , not ) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | **UNKNOWN** |
| STRIPE_WEBHOOK_SECRET | **UNKNOWN** |
| Stripe mode TEST/LIVE | **UNKNOWN** (must not assume) |
| Resend | **UNKNOWN** |
| EMAIL_FROM_ADDRESS | **UNKNOWN** |
| NEXT_PUBLIC_APP_URL | **CONFIGURED** (site serves) |
| S3/R2 | **UNKNOWN** (code supports optional S3 + local fallback) |
| QA accounts | **MISSING** to this agent |

**OBJECT_STORAGE: OPTIONAL** for current release path (local durable fallback exists). Private evidence ACL still required regardless of provider.

## Full cert remaining

| Gate | Status |
|------|--------|
| PRIVATE MEDIA (party ACL) | BLOCKED |
| DELIVERY / Madmoon auth E2E | BLOCKED |
| AUTO RELEASE / AUTHORIZED CRON | BLOCKED |
| DISPUTES E2E | BLOCKED |
| LEDGER live | BLOCKED |
| RBAC live matrix | BLOCKED |
| PLAYWRIGHT full auth | BLOCKED (guest suite only previously PASS) |
| STRIPE TEST matrix | BLOCKED |
| EMAIL delivery | BLOCKED |

## Rollback path (if later needed)

- Baseline: 
- Method: normal **revert PR** of  (no force-push, no history rewrite)

## Owner next actions

1. Confirm Production Stripe mode (**TEST vs LIVE**) without exposing keys  
2. Set  (Preview + Production if intended), redeploy, prove unauthorized 401 and authorized success  
3. Provide QA Buyer/Seller/Admin/RBAC credentials to Cloud agent  
4. Complete full financial + Madmoon + dispute + RBAC recert before any PRODUCTION READY claim  
