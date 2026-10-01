# AGENTS.md

## Cursor Cloud specific instructions

This repo is a Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 marketplace for **Sooqna (سوقنا)** — production domain **`https://sooqnauae.com`**.

It is **not** mocks-only anymore: durable data lives in Neon Postgres (JSON payload tables) when `DATABASE_URL` is set, with local `.data/` fallback. Stripe Checkout + escrow, Resend email, admin ops desks, chat, and notifications are implemented.

Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`); see `README.md` and `PRODUCTION_DEPLOYMENT_GUIDE.md`.

Notes:

- Dev server: `npm run dev` → `http://localhost:3000` (Turbopack).
- Routes include marketplace browse/search/listings, auth, wallet/Connect, escrow/checkout, admin desks (`/admin/*`).
- Production env essentials: `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, Stripe trio, `OTP_PEPPER`. Demo accounts stay **off** on Vercel (`ALLOW_DEMO_ACCOUNTS=false`).
- Mock checkout and live curated catalog default **off** on Vercel production/preview.
- Run `npm test`, `npm run lint`, and `npm run build`. Certify one live AED checkout before marketing spend.
- Brand: `Sooqna` / `سوقنا` in user-facing copy. Support: `support@sooqnauae.com`.
