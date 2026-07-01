# Edison — Missed Call Rescue

When a local service business misses a call, Edison auto-texts the caller, has an
AI conversation (Claude) to understand their need, and books them on the
calendar. Next.js (App Router) + Postgres/Prisma + Twilio + Anthropic.

> The original Claude Design handoff bundle (brief, chat transcript, HTML
> mockups) lives in [`chats/`](./chats) and [`project/`](./project). The app's
> dashboard implements the design's **"Focus"** direction (money-first ROI
> tracker).

## What's built

The customer touchpoint is **SMS only** — no chat widget, no app. The owner
dashboard is a **read-only viewer** of the text thread; to reply directly the
owner texts from their own phone. The conversation engine defaults to **Claude
Haiku** (cheapest tier), set via `CLAUDE_MODEL_ID`.

**Day 1 — capture**
- Prisma schema: `Business`, `Location`, `Worker`, `Conversation`, `Message`
  (with `inputTokens`/`outputTokens`/`modelUsed` for real COGS), `UsageRecord`.
- Twilio Voice webhook → missed-call detection, creates a `Conversation`, sends
  the auto-text, and passes the live setup test on first missed call.
- Twilio SMS webhook → logs inbound, runs the AI engine, sends the reply.
- Claude engine (`src/lib/conversation.ts`): system prompt from business
  type/tone/hours/workers; forced `respond_to_customer` tool call (`strict:true`)
  returning reply text + intent + need + booking signal in one request; token
  usage logged per call; human escalation after 2 unresolved exchanges.

**Day 2 — book, sell, configure**
- Google Calendar OAuth + booking: Edison pulls real open slots into the SMS
  conversation and creates the event on confirmation (`src/lib/google.ts`).
- Owner dashboard ("Focus" design): paid-for-itself tracker, usage counter,
  recent leads. Conversation list + read-only transcript viewer.
- Setup wizard: carrier dropdown → forwarding code (copy + tap-to-call) → live
  test that flips green when the webhook fires, with a troubleshooting branch.
- Stripe: card-required checkout, 14-day trial, subscription webhooks
  (created/updated/canceled, payment succeeded/failed) syncing `Business` state.
- Worker routing (always-to-owner / round-robin / keyword + call-out backup) and
  a settings panel (hours, routing, avg ticket, auto-text wording, worker out).

**Day 3 — scale, bill, monitor**
- Multi-location pricing tiers ($79 / $69 / $59 per location) on the billing page.
- Weekly value report cron → aggregates 7 days + emails a screenshot-friendly
  summary via Resend (`/api/cron/weekly-report`).
- Overage billing cron → pushes per-conversation overage to Stripe metered
  billing; hard-caps at 1,000/mo and flags for review (`/api/cron/overage-billing`).
- Admin/CEO cockpit (`/admin`): MRR, subscribers by plan, trials, conversion,
  churn, platform conversations, real-time estimated COGS + margin, near-limit
  and failed-payment watchlists.
- Marketing landing page (`/`).

### Pricing

| Plan | $/mo | Included | Overage |
|---|---|---|---|
| Founding (first 90 days, locked for life) | $49 | 300 | $0.15/conv |
| Standard | $79 | 300 | $0.15/conv |
| High-volume | $99 | 600 | $0.15/conv |

Hard cap: 1,000 conversations/mo, then auto-billing is blocked and the account
is flagged for manual review.

### What needs external setup to go live

Functional but gated on credentials/config you supply: Stripe products/prices &
webhook secret, Google OAuth consent + secret, Resend API key, per-business
Twilio number provisioning, a real Postgres `DATABASE_URL`, and `ADMIN_PASSWORD`
/ `CRON_SECRET`. Everything degrades gracefully when a key is absent.

## Architecture

```
Missed call ─▶ Twilio Voice webhook ─▶ create Conversation + send greeting SMS
Customer text ─▶ Twilio SMS webhook ─▶ log inbound ─▶ Claude engine ─▶ send reply
                                                          │
                                            structured triage → Conversation
                                                          │
                                            worker routing (round-robin / keyword)
```

- `src/lib/conversation.ts` — the Claude engine (system prompt, forced tool
  call, escalation, persistence, SMS send).
- `src/lib/routing.ts` — worker assignment (always-to-owner / round-robin /
  keyword + call-out backup).
- `src/lib/usage.ts` — per-month conversation + overage counting.
- `src/lib/dashboard.ts` — dashboard metrics (with sample-data fallback).

## Setup

```bash
npm install
cp .env.example .env            # fill in real values (see below)
npm run db:migrate              # apply migrations (needs a reachable Postgres)
npm run db:seed                 # seed one demo business + workers + a login
npm run dev                     # http://localhost:3000
```

> Use `.env`, not `.env.local` — the Prisma CLI (`db:migrate`, `db:seed`) reads
> `.env` and ignores `.env.local`. Both files are gitignored.

> New to the repo? [`docs/RUN_FROM_SCRATCH.md`](docs/RUN_FROM_SCRATCH.md) walks
> through this on a fresh Mac step by step, including how to get Postgres.

### Environment variables

See `.env.example`. Required for Day 1: `DATABASE_URL`, `ANTHROPIC_API_KEY`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

`.env` is gitignored — **never commit real secrets.** Set
`TWILIO_SKIP_SIGNATURE_VALIDATION=true` only for local dev without a public URL.

### Wiring up Twilio

Point your Edison number's webhooks at the deployed app:

- Voice (missed call): `POST {APP_BASE_URL}/api/webhooks/twilio/voice`
- Messaging (inbound SMS): `POST {APP_BASE_URL}/api/webhooks/twilio/sms`

The `Business.twilioNumber` must match the Edison number Twilio dials/sends to.

**Batches 1–4 — polish, accounts, analytics, multi-location**
- Marketing site (about / services / pricing / contact / per-industry landing
  pages), 404, and light/dark mode.
- Multi-user accounts with roles, password reset, baseline DB migrations, and a
  test-lead simulator that runs a fake conversation through Claude without
  sending SMS.
- Owner analytics/reports (hour & weekday histograms, topics, intents, worker
  leaderboard) and worker management.
- Multi-location fleet map (Mapbox) with per-location Twilio numbers and
  location-aware call/SMS routing, plus a private CEO financial-scenario model
  at `/admin/model`.

## Documentation & guides

Start here depending on what you're doing:

| I want to… | Read |
|---|---|
| Run the app on my machine from a fresh `git clone` | [`docs/RUN_FROM_SCRATCH.md`](docs/RUN_FROM_SCRATCH.md) |
| Set up a test database + test account and try it end-to-end | [`docs/TESTING.md`](docs/TESTING.md) |
| Test it on my own cell phone and review the website | [`docs/TESTING.md`](docs/TESTING.md#4-tester-run-on-your-cell-phone) |
| Take it from sandbox to live (keys, usage, rollout) | [`docs/GO_LIVE.md`](docs/GO_LIVE.md) |
| Deploy to Vercel + Neon + IONOS domain | [`DEPLOY.md`](DEPLOY.md) and [`docs/GO_LIVE.md`](docs/GO_LIVE.md) |
| Onboard a new business (call forwarding setup) | [`docs/CALL_FORWARDING.md`](docs/CALL_FORWARDING.md) |

### Test account

After `npm run db:seed`, log in with:

```
URL:      http://localhost:3000/login
Email:    owner@rivera-comfort.test
Password: password123
```

Admin/CEO cockpit (`/admin`) uses the `ADMIN_PASSWORD` you set in `.env`.

## Notes

- Model: `claude-haiku-4-5` (cheapest tier) via the official `@anthropic-ai/sdk`,
  overridable with `CLAUDE_MODEL_ID`.
- Carrier forwarding codes, per-vertical ticket prices, and live Stripe products
  are owner-supplied content (Day 2+), not generated by the app.
