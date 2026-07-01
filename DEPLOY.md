# Deploying Edison

Edison is a Next.js (App Router) app with PostgreSQL/Prisma, Twilio, Anthropic,
Stripe, Google Calendar, and Resend. It needs a Node server + a Postgres
database — **GitHub Pages will not work** (static only). Use **Vercel** (+ Neon
Postgres) or Railway.

## 1. Database (Neon — your live DB)

1. Create a project at [neon.tech](https://neon.tech). This is your production DB.
2. Copy **both** connection strings:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** (no `-pooler`) → `DIRECT_URL`  *(migrations use this)*
   - If you only have one URL (e.g. local Docker), set `DIRECT_URL` = `DATABASE_URL`.
3. To test without touching production, create a Neon **branch** (e.g. `dev`) and
   point your laptop's `.env.local` at the branch string.

## 2. Apply the schema (migrations)

Edison uses versioned Prisma migrations (in `prisma/migrations/`).

```bash
# with DATABASE_URL + DIRECT_URL set to your DB:
npm run db:migrate       # prisma migrate deploy — applies all migrations
```

> ⚠️ **Do not run `npm run db:seed` against production.** The seed inserts a demo
> business and claims your Twilio number. On the live DB, create your real
> business through `/signup` instead.

When you change `schema.prisma` later, create a new migration locally with
`npm run db:migrate:dev -- --name your_change`, commit it, and `npm run db:migrate`
deploys it.

## 3. Deploy to Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project → Import** `thepacheco/edison_ring`.
2. **Settings → Environment Variables** — set everything from `.env.example`:
   - `DATABASE_URL`, `DIRECT_URL`
   - `ANTHROPIC_API_KEY`, `CLAUDE_MODEL_ID=claude-haiku-4-5`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_SKIP_SIGNATURE_VALIDATION=false`
   - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (+ optional `STRIPE_PRICE_*`)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`
   - `NEXTAUTH_SECRET` (long random), `ADMIN_PASSWORD`, `CRON_SECRET`
   - `APP_BASE_URL` = your deployed URL
3. Deploy. Then apply migrations once against the prod DB (from your laptop, with
   prod `DATABASE_URL`/`DIRECT_URL`): `npm run db:migrate`.
4. The cron jobs in `vercel.json` run automatically (weekly report, overage billing).

## 4. Custom domain (IONOS)

1. Vercel → **Settings → Domains** → add `yourdomain.com` + `www`. Vercel shows the exact DNS records.
2. IONOS → **Domains & SSL → DNS**:
   - Apex `@`: **A → `76.76.21.21`**
   - `www`: **CNAME → `cname.vercel-dns.com`**
   - remove conflicting A/CNAME records on those hosts
3. Vercel auto-issues HTTPS. Then set `APP_BASE_URL=https://yourdomain.com` and redeploy.

## 5. Wire the integrations to the live URL

- **Twilio number** → Voice webhook `https://yourdomain.com/api/webhooks/twilio/voice`, Messaging `…/api/webhooks/twilio/sms`.
  - Toll-free numbers need **Toll-Free Verification** for SMS at scale (voice works immediately).
- **Stripe** → webhook endpoint `…/api/stripe/webhook` (paste its signing secret into `STRIPE_WEBHOOK_SECRET`).
- **Google OAuth** → authorized redirect URI `…/api/google/callback`.

## 6. First run

- Open `/signup`, create your real business (this creates the owner login).
- `/setup` → forward your number → the live test flips green on the first missed call.
- Prefer to see it work before wiring the phone? Click **⚡ Run a test lead** on the
  dashboard — it simulates a missed-call conversation through the AI engine
  (no SMS sent).
- `/admin/login` with `ADMIN_PASSWORD` → the CEO cockpit.
