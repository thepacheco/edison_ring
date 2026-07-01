# Sandbox → Live: the go-live runbook

You've tested Edison in the sandbox ([TESTING.md](TESTING.md)). Now you're taking
it live: swapping every **test/temporary key for a fresh live key** ("recycling"),
plugging them into production, watching usage, and rolling it out safely.

[DEPLOY.md](../DEPLOY.md) is the mechanical "click here in Vercel/Neon/IONOS"
guide. **This doc is the workflow around it** — what to rotate, in what order, and
how to monitor once you're live.

---

## The golden rule: sandbox keys never touch production

Any key you pasted during development or testing is **burned** — treat it as
compromised the moment it lived in a `.env.local`, a chat, or a screenshot.
Before launch, generate brand-new keys for every service and put them **only** in
your host's encrypted environment settings (Vercel), never in the repo.

> If you shared any real key during the build, **rotate it now** even if it
> "still works." That's what recycling means below.

---

## 1. Recycle every API key (rotate → plug in)

Do these one service at a time. For each: create a new key/secret in the
provider's dashboard, paste it into **Vercel → Settings → Environment Variables**
(Production scope), then delete/disable the old one.

| Service | What to create (live) | Vercel env var(s) | Where |
|---|---|---|---|
| **Anthropic** | New API key | `ANTHROPIC_API_KEY`, `CLAUDE_MODEL_ID=claude-haiku-4-5` | console.anthropic.com → API Keys |
| **Database** | Live Neon project (not the test branch) | `DATABASE_URL` (pooled), `DIRECT_URL` (direct) | neon.tech |
| **Twilio** | Live number(s); keep SID, **rotate Auth Token** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_SKIP_SIGNATURE_VALIDATION=false` | console.twilio.com |
| **Stripe** | Switch to **live mode**, live secret + publishable, new webhook | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `STRIPE_PRICE_*` | dashboard.stripe.com (toggle Test→Live) |
| **Google** | OAuth client with live redirect URI | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | console.cloud.google.com |
| **Resend** | New API key, verified sending domain | `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL` | resend.com |
| **App secrets** | Fresh random values | `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET` | generate yourself |
| **App** | Your real domain | `APP_BASE_URL=https://yourdomain.com` | — |
| **Maps** | Public Mapbox token (optional) | `NEXT_PUBLIC_MAPBOX_TOKEN` | mapbox.com |

Generate strong secrets with:

```bash
openssl rand -base64 32     # run once per secret (NEXTAUTH_SECRET, CRON_SECRET, ADMIN_PASSWORD)
```

> `NEXT_PUBLIC_*` vars are **exposed in the browser** — only put publishable
> tokens there (the Mapbox public token and Stripe publishable key are fine).
> Never a secret key.

---

## 2. Point live integrations at your live URL

After the domain is set (see [DEPLOY.md §4](../DEPLOY.md)):

- **Twilio number → webhooks**
  - Voice: `https://yourdomain.com/api/webhooks/twilio/voice`
  - Messaging: `https://yourdomain.com/api/webhooks/twilio/sms`
  - Toll-free numbers need **Toll-Free Verification** before they can send SMS at
    volume (voice works immediately). Local numbers are simplest to start.
  - Per-location numbers you provision from `/locations` are auto-wired to these
    same webhook URLs.
- **Stripe → webhook endpoint** `https://yourdomain.com/api/stripe/webhook` —
  copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
- **Google → authorized redirect URI** `https://yourdomain.com/api/google/callback`.

---

## 3. Apply the schema to the live DB (once)

From your laptop, with **production** `DATABASE_URL`/`DIRECT_URL` set:

```bash
npm run db:migrate     # prisma migrate deploy — applies all migrations
```

**Do NOT run `npm run db:seed` against production** — it inserts a demo business
and claims a Twilio number. Create your real business through `/signup` instead.

---

## 4. Smoke-test production before any real customer

1. `/signup` → create your real business (this is your owner login).
2. `/setup` → forward your number → confirm the live-test flips green on the
   first missed call. See [CALL_FORWARDING.md](CALL_FORWARDING.md).
3. From a phone, text/call the live number and confirm a real end-to-end
   conversation (same as [TESTING.md §4](TESTING.md#4-tester-run-on-your-cell-phone)).
4. Do a **$1 real card** trial checkout in Stripe live mode to confirm the
   subscription webhook flips the business to active, then cancel/refund.
5. `/admin/login` → confirm the CEO cockpit shows the new subscriber.

---

## 5. Monitor usage (day-to-day)

Once customers are on it, watch these — most are built in.

| What | Where | Watch for |
|---|---|---|
| Conversations per business, near/over limit | `/admin` → "Near / over conversation limit" | Anyone at ≥90% of their plan → overage or upsell |
| MRR, subscribers, trials, conversion, churn | `/admin` | Trials with ≤3 days left; any churn |
| Failed payments | `/admin` → "Failed payments" | Recover before the sub cancels |
| Real COGS + margin | `/admin` (est. COGS/margin) and `/admin/model` | Margin dropping → revisit pricing/COGS sliders |
| Claude spend + token usage | console.anthropic.com → Usage | Spikes vs. your COGS assumptions |
| Twilio spend + delivery/errors | console.twilio.com → Monitor → Logs/Usage | Undelivered SMS, carrier filtering (A2P/10DLC) |
| Stripe payments/disputes | dashboard.stripe.com | Disputes, involuntary churn |
| App errors/latency | Vercel → your project → Logs / Observability | 500s on webhook routes |
| DB size/connections | Neon dashboard | Pooler saturation, storage |

The **hard cap is 1,000 conversations/month** per business — beyond that, auto
overage billing is blocked and the account is flagged for manual review (protects
you from a runaway bill). Watch the near-limit panel so nobody hits it by surprise.

The weekly value report cron (Resend) and the overage-billing cron run
automatically from `vercel.json` — confirm they're firing in Vercel → Crons.

---

## 6. Roll out gradually

Don't flip everyone on at once.

1. **Yourself first** — run your own number through it for a few days.
2. **1–2 friendly pilot businesses** — real missed calls, watch the transcripts
   daily, tune each business's tone/hours/auto-text wording in **Settings**.
3. **Small cohort** — onboard a handful; keep an eye on `/admin` usage + COGS.
4. **Open up** — once margins and quality hold, scale acquisition. Use
   `/admin/model` to sanity-check that new-customer/CAC/churn assumptions still
   pencil out before you spend on growth.

**Rollback plan:** if something's wrong, in Twilio point the affected number's
webhooks back to a safe URL (or disable), and in Vercel roll back to the previous
deployment (Deployments → … → Promote). The database is unaffected by a code
rollback as long as you haven't run a destructive migration.

---

## Pre-launch checklist

- [ ] Every sandbox/test/temp key rotated; old ones deleted
- [ ] All env vars set in Vercel **Production** scope (nothing real in the repo)
- [ ] `npm run db:migrate` applied to the **live** DB; **not** seeded
- [ ] Twilio voice + SMS webhooks point at the live domain
- [ ] Stripe live webhook added; `STRIPE_WEBHOOK_SECRET` set
- [ ] Google redirect URI updated for the live domain
- [ ] `APP_BASE_URL` = live URL; `TWILIO_SKIP_SIGNATURE_VALIDATION=false`
- [ ] Real signup + `/setup` live test passed on a real missed call
- [ ] Test checkout confirmed the subscription webhook works
- [ ] Crons visible in Vercel → Crons
- [ ] `/admin` monitoring reviewed and bookmarked
