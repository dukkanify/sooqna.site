# Sooqna golden live lock — 2026-09-15

**Owner:** Dukkanify Technology LLC  
**Purpose:** Freeze the current live Production so later edits start from this snapshot and do not require redoing the same golden work.

No application code was changed in this lock. No Production data was deleted. UAE-Sales was not modified. AviatorPass was not modified. Previous 2026-09-14 goldens were **not** rewritten.

---

## SOURCE OF TRUTH (do not move development off this)

```
dukkanify/sooqna.site
        ↓
main  @  11a775e68e70c8c2f1a06929a4cf262e1f71fd1c
        ↓
Vercel project sooqna
        ↓
https://sooqna.site
```

| Field | Value |
|---|---|
| Repository | `dukkanify/sooqna.site` |
| Branch | `main` |
| Live Production SHA | `11a775e68e70c8c2f1a06929a4cf262e1f71fd1c` |
| `origin/main` | **same SHA** |
| GitHub Production deploy | `6449464103` (success) |
| Live HTML deploy | `dpl_5z8xNbnTKyqRQW9oVJEoa74bULLM` |
| Domain | https://sooqna.site |
| Title | Sooqna \| سوقنا |
| Persistence | Postgres `auth_users`, durable, not degraded |
| MAIN = PRODUCTION | **YES** |

---

## GOLDEN REFS (keep forever; do not force-push)

| Kind | Name | SHA |
|---|---|---|
| **New backup branch** | `backup/dukkanify-golden-20260915` | `11a775e68e70c8c2f1a06929a4cf262e1f71fd1c` |
| **New tag** | `dukkanify-sooqna-golden-20260915` | `11a775e68e70c8c2f1a06929a4cf262e1f71fd1c` |
| Previous backup | `backup/dukkanify-golden-20260914-final` | `3bc2bf3b11617ed6fb5041aa7677196b4d9f8742` |
| Previous backup | `backup/dukkanify-golden-20260914` | `e5b2bbf4c885160bd9c341fcb8cfef00d449756a` |
| Previous tag | `dukkanify-sooqna-golden-20260914-final` | `3bc2bf3b11617ed6fb5041aa7677196b4d9f8742` |
| Previous tag | `dukkanify-sooqna-golden-20260914` | `e5b2bbf4c885160bd9c341fcb8cfef00d449756a` |

Restore this live golden later with:

```bash
git fetch origin
git checkout 11a775e68e70c8c2f1a06929a4cf262e1f71fd1c
# or
git checkout dukkanify-sooqna-golden-20260915
```

---

## WHAT THIS GOLDEN ALREADY CONTAINS

All of this is on `main` / Production; it is an ancestor chain, not a rewrite:

| Landed | SHA / PR |
|---|---|
| LoginForm `next: null` hotfix | #11 `3bc2bf3` (previous final golden) |
| Golden production lock docs | #10 / #12 |
| Buy Again from order details | #13 `6e51fa7` |
| Allowlisted isolated QA cleanup endpoint | #14 `e4933b0` |
| Two-project isolation inventory | #15 `11a775e` (this live tip) |
| Smart filters, mobile logout, password-reset persist, admin dashboard | earlier merged `main` |

---

## HOW TO ADD NEW UPDATES (so they stay, once)

1. Open **only** `dukkanify/sooqna.site`.
2. Start from **latest** `origin/main` (this golden, plus anything merged after it).
3. Create a feature/fix branch: `cursor/<short-name>-f438` (or the team’s usual prefix).
4. Preview → QA → PR → merge to `main` → Production.
5. Do **not** develop Sooqna on `UAE-Sales`.
6. Do **not** use old Cursor chats as source of truth.
7. Do **not** force-push `main`, golden tags, or `backup/dukkanify-golden-*`.

If a later live state should become the new golden, add a **new** dated backup + tag. Never move the 20260915 tag.

---

## AVIATORPASS (separate product — not this golden)

| Field | Value |
|---|---|
| Repository | `dukkanify/AviatorPass` |
| Branch | `main` |
| Production SHA | `4694e02d2f06b9c2447801eaa5c9256c55ec7d3c` |
| Domain | https://aviatorpass.com/ → https://www.aviatorpass.com/ |

Do not copy Sooqna work into AviatorPass or the reverse.

---

## UAE-SALES

Legacy Sooqna source only. Archive / read-only. Not used for this lock.

---

## LIVE CONFIG NOTE (unchanged)

`GET https://sooqna.site/api/auth/status`: Postgres, Resend, Stripe, session secret **configured**.  
`CRON_SECRET` still **missing** (`cronSecretConfigured: false`). Unauthorized cron remains fail-closed **503** `CRON_SECRET_REQUIRED`. Setting that secret is a separate owner ops action; it is not part of rewriting golden product work.

---

## LOCK RESULT

```
GOLDEN LIVE SHA = 11a775e68e70c8c2f1a06929a4cf262e1f71fd1c
MAIN = PRODUCTION = YES
BACKUP BRANCH = backup/dukkanify-golden-20260915
TAG = dukkanify-sooqna-golden-20260915
PREVIOUS GOLDENS PRESERVED = YES
NO DATA DELETED = YES
NO UNKNOWN BRANCHES TOUCHED = YES
```
