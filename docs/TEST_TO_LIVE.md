# Edison: Test → Live, step by step (no experience assumed)

This is the one document to follow from "I have the code" to "it's live and a real
customer got a text." It assumes you've never used Neon, Vercel, or Stripe. Every
step says **exactly what to click, what to copy, and where to paste it.**

Read it top to bottom the first time. There are two halves:

- **PART A — TEST:** get it running safely on a throwaway database and test
  everything (including on your own phone) where nothing can hurt real customers.
- **PART B — LIVE:** put the same app online for real.

> **The one idea that makes this simple:** the code never changes between test and
> live. "Going live" is just the same app pointed at a real database and real keys.
> So if it works in test, it works live.

---

## The stack in one minute (what each thing is)

| Service | What it is | What it does for Edison |
|---|---|---|
| **Neon** | A cloud Postgres database | Stores businesses, conversations, appointments |
| **Vercel** | A website host | Runs the app on the internet at a URL |
| **Twilio** | Phone/SMS provider | Owns the "Edison number," sends & receives texts |
| **Anthropic (Claude)** | The AI | Writes the text replies |
| **Stripe** | Payments | Subscriptions, trials, billing |
| **Resend** | Email | Weekly reports, password resets (optional) |
| **Google** | Calendar (optional) | Auto-booking — Edison has its own calendar too |

You need Neon + Vercel + Twilio + Anthropic to be *operational*. Stripe is for
charging. Resend + Google are optional niceties.

---

# PART A — TEST ENVIRONMENT

Goal: run Edison on your laptop against a **throwaway** database and test it.

## A1. Make a test database (Neon)

1. Go to **[neon.tech](https://neon.tech)** and sign in.
2. If you already made a project, open it. Otherwise **New Project** (any name,
   region close to you).
3. On the left, click **Branches** → **New branch** → name it **`test`**. (A
   branch is a copy of your database you can break freely.)
4. Click the **`test`** branch → **Connect** (or "Connection string"). You'll see
   a dropdown — make sure it shows the **pooled** connection. Copy the string. It
   looks like:
   `postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
5. You need a second version of it, the **direct** one: it's the same string with
   **`-pooler` removed** from the host. (Neon also shows it if you toggle off
   "Pooled connection.")

Keep both strings handy for the next step.

## A2. Put the database strings in `.env`

In the project folder on your Mac:

1. Create the env file (one time):
   ```bash
   cp .env.example .env
   ```
   > Use **`.env`**, NOT `.env.local`. Prisma (the database tool) only reads
   > `.env`. This is the #1 setup mistake.
2. Open it: `open -e .env`
3. Set these two lines (paste your strings). Keep `sslmode=require`, and **delete
   any `&channel_binding=require`** — it breaks Prisma:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
4. Set the AI key (so texts actually generate) and a few local conveniences:
   ```
   ANTHROPIC_API_KEY=sk-ant-...        (from console.anthropic.com → API Keys)
   CLAUDE_MODEL_ID=claude-haiku-4-5
   TWILIO_SKIP_SIGNATURE_VALIDATION=true
   NEXTAUTH_SECRET=any-long-random-text-change-me
   ADMIN_PASSWORD=letmein
   APP_BASE_URL=http://localhost:3000
   ```
5. Save and close.

## A3. Build the database + run it

```bash
npm install
npm run db:migrate     # creates all the tables in your test database
npm run db:seed        # adds a demo business + a login
npm run dev            # starts the app
```

> If `db:migrate` errors once, run it again — Neon's database "wakes up" from
> idle on the first connection.

Open **http://localhost:3000**, click **Log in**, use:
```
owner@rivera-comfort.test  /  password123
```

## A4. Test the AI (no phone needed)

On the dashboard, click **⚡ Run a test lead**. This runs a fake missed-call
conversation through the real AI and drops you into the transcript. Do it a few
times, then check **Conversations**, **Calendar**, and **Reports** — they'll fill
in. This proves the brain works before you touch phones.

## A5. Test Stripe (test mode — no real money)

Stripe has a "test mode" that behaves exactly like live but charges fake cards.

1. In `.env`, add your **test** Stripe keys (Stripe Dashboard → make sure the
   **"Test mode"** toggle at top-right is ON → **Developers → API keys**):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
   Restart `npm run dev` after editing `.env`.
2. In the app go to **Billing** → start a plan/checkout.
3. On Stripe's checkout page, pay with the **magic test card**:
   ```
   Card: 4242 4242 4242 4242
   Expiry: any future date (e.g. 12/34)   CVC: any 3 digits   ZIP: any
   ```
4. **What "working" looks like:** you're redirected back, and the business shows
   as trialing/active. In your Stripe Dashboard (test mode) → **Payments** you'll
   see the test transaction.

> Full billing sync (subscription status auto-updating) needs a Stripe *webhook*,
> which needs a public URL — you'll set that in PART B. For local testing, seeing
> the checkout succeed is enough.

## A6. Test on your own phone

Texting needs Twilio to reach your app, and Twilio can't reach `localhost`. Two
options — the second is easier and doubles as your live setup:

**Option 1 — quick tunnel (ngrok):**
1. Install [ngrok](https://ngrok.com), run `ngrok http 3000`.
2. It gives you a URL like `https://abc123.ngrok.io`. Put that as `APP_BASE_URL`
   in `.env`, set `TWILIO_SKIP_SIGNATURE_VALIDATION=false`, restart the app.

**Option 2 — just do PART B** (deploy to Vercel) and test on the real URL.

Then, with a Twilio number configured (see B4 for the webhook wiring):
1. **Text your Twilio number** from your cell: *"Hi, do you do AC repair?"*
2. Within a few seconds you get Edison's reply back. Reply naturally and watch it
   book or hand off.
3. The thread appears live under **Conversations**.

> **Twilio trial accounts** can only text **verified** numbers — verify your cell
> in Twilio Console → **Phone Numbers → Verified Caller IDs**, or upgrade.
> And remember a **toll-free** number can't text until it passes Toll-Free
> Verification (see B5).

✅ When texts work on your phone in test, you're ready for live.

---

# PART B — LIVE ENVIRONMENT

Goal: the same app online, with your real database + real keys, at a real URL.

## B1. Your live database (Neon)

Use your Neon project's **main** branch (not `test`) as live. Copy its **pooled**
and **direct** strings the same way as A1. You'll paste them into Vercel (not a
file) in B3.

## B2. Put the code on GitHub (already done)

Your code is at `github.com/thepacheco/edison_ring`. Make sure the branch you want
is merged into **`main`** (merge the open pull request on GitHub). Vercel deploys
`main`.

## B3. Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** → sign in with GitHub.
2. **Add New → Project → Import** `thepacheco/edison_ring`.
3. It auto-detects Next.js. **Before clicking Deploy**, open **Environment
   Variables** and add each one below (Name on the left, value on the right).
   These are the SAME names as your `.env`, just entered in Vercel's boxes:

   | Name | Value / where to get it |
   |---|---|
   | `DATABASE_URL` | Neon **main** pooled string (`sslmode=require`, no `channel_binding`) |
   | `DIRECT_URL` | Neon **main** direct string (no `-pooler`) |
   | `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
   | `CLAUDE_MODEL_ID` | `claude-haiku-4-5` |
   | `TWILIO_ACCOUNT_SID` | Twilio Console home page (`AC…`) |
   | `TWILIO_AUTH_TOKEN` | Twilio Console home page |
   | `TWILIO_PHONE_NUMBER` | your Edison number, e.g. `+1877…` |
   | `TWILIO_SKIP_SIGNATURE_VALIDATION` | `false` |
   | `STRIPE_SECRET_KEY` | Stripe (LIVE mode) → Developers → API keys (`sk_live_…`) |
   | `STRIPE_PUBLISHABLE_KEY` | Stripe (LIVE) → API keys (`pk_live_…`) |
   | `STRIPE_WEBHOOK_SECRET` | you'll fill this in B6 (`whsec_…`) |
   | `NEXTAUTH_SECRET` | long random text (run `openssl rand -base64 32`) |
   | `ADMIN_PASSWORD` | a password you choose (protects `/admin`) |
   | `CRON_SECRET` | any long random text |
   | `APP_BASE_URL` | your Vercel URL (fill after first deploy, e.g. `https://edison-xxx.vercel.app`) |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | *optional* — skip; Edison has its own calendar |
   | `RESEND_API_KEY` / `EMAIL_FROM` | *optional* — for emails |
   | `NEXT_PUBLIC_MAPBOX_TOKEN` | *optional* — for the locations map |

4. Click **Deploy**. Wait ~2 minutes. You get a URL like
   `https://edison-xxx.vercel.app`.
5. Copy that URL, go to **Settings → Environment Variables**, set `APP_BASE_URL`
   to it, and **redeploy** (Deployments → ⋯ → Redeploy).

## B4. Create the tables in the live database (once)

From your Mac, with your **live** Neon strings temporarily in `.env`:
```bash
npm run db:migrate
```
This builds all the tables in the live database. **Do NOT run `npm run db:seed`
on live** — that inserts the demo business. Real businesses sign up through
`/signup` instead.

## B5. Point Twilio at your live app

In **Twilio Console → Phone Numbers → Active Numbers → click your number**:

- **Voice → "A call comes in"** → Webhook →
  `https://YOUR-URL.vercel.app/api/webhooks/twilio/voice` (HTTP POST)
- **Messaging → "A message comes in"** → Webhook →
  `https://YOUR-URL.vercel.app/api/webhooks/twilio/sms` (HTTP POST)
- Save.

**Toll-free texting (important):** if your number starts with `1-8xx`, open
**Messaging → Regulatory Compliance → Toll-Free Verification** and submit it.
Until it's approved, calls/forwarding work but **texts to customers are blocked**.
(A local 10-digit number instead needs "A2P 10DLC" registration.) Start this
early — approval takes days.

## B6. Point Stripe at your live app

1. Stripe Dashboard (LIVE mode) → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-URL.vercel.app/api/stripe/webhook`
3. Select events: the subscription + invoice ones (or "all events" to start).
4. After creating it, Stripe shows a **Signing secret** (`whsec_…`). Copy it →
   Vercel → `STRIPE_WEBHOOK_SECRET` → redeploy.

This is what makes subscriptions auto-update in Edison.

## B7. Go-live test (do this before any real customer)

1. Open `https://YOUR-URL.vercel.app/signup` → create your real business. This is
   your owner login.
2. Go to **Setup** → pick your phone type → dial the forwarding code it shows →
   the live-test indicator turns green on the first forwarded missed call.
3. From a different phone, **call your business line and let it ring out** — you
   should get Edison's text seconds later. Reply and watch it work.
4. Do a **real** Stripe checkout with a real card (then refund it) to confirm the
   webhook flips the business to active. Check `/admin` — it shows the subscriber.

🎉 If a real missed call produced a real text and the transcript shows in the
dashboard, **you're live.**

---

## Where every code lives (quick reference)

| You need… | Find it here | Goes into (env var) |
|---|---|---|
| Database URLs | Neon → your branch → Connect | `DATABASE_URL`, `DIRECT_URL` |
| Claude key | console.anthropic.com → API Keys | `ANTHROPIC_API_KEY` |
| Twilio SID + token | Twilio Console → home page | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| Edison phone number | Twilio Console → Phone Numbers | `TWILIO_PHONE_NUMBER` |
| Stripe keys | Stripe → Developers → API keys | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| Stripe webhook secret | Stripe → Developers → Webhooks → your endpoint | `STRIPE_WEBHOOK_SECRET` |
| Admin password | you make it up | `ADMIN_PASSWORD` |
| Session/cron secrets | run `openssl rand -base64 32` | `NEXTAUTH_SECRET`, `CRON_SECRET` |

**Test vs live keys:** Stripe and Twilio each have test/trial and live versions.
Use test/trial in PART A, live in PART B. Everything else (Neon, Anthropic) is the
same key — just point at a different Neon branch for test vs live.

---

## Onboarding a business: forwarding for cell, landline, or home phone

When a new business signs up, the **Setup wizard** (`/setup`) asks what kind of
phone they have and shows the exact steps. It now covers more than cell phones:

- **Cell phone (AT&T / Verizon / T-Mobile):** dial a short code once
  (e.g. AT&T `*004*<EdisonNumber>#`). Forwards only on missed/busy — their phone
  still rings normally.
- **Landline (traditional copper):** dial `*92<EdisonNumber>` to forward on
  no-answer, `*93` to cancel. Codes vary by local phone company — if it doesn't
  take, they call the phone company and ask to turn on **"Call Forwarding No
  Answer"** to the Edison number.
- **Home / office VoIP (Xfinity, Spectrum, Ooma, Vonage, Fios):** there's no dial
  code — it's set in the provider's app/website under **Call Forwarding → No
  Answer (or Busy) →** the Edison number.
- **Not sure:** the wizard routes them to support.

The rule for all of them: it's **conditional** forwarding (only when they miss the
call), never "forward all." The `/setup` live test confirms it worked. Full
per-carrier detail: [`CALL_FORWARDING.md`](CALL_FORWARDING.md).

---

## If something breaks

| Symptom | Fix |
|---|---|
| `Environment variable not found: DIRECT_URL` on migrate | Your DB URLs are in `.env.local`, not `.env`. Use `.env`. |
| `db:migrate` times out first try | Neon waking up — run it again. |
| App loads but no AI replies | `ANTHROPIC_API_KEY` missing/wrong. |
| Texted the number, no reply | Twilio webhooks not set (B5), or toll-free not verified (B5), or (trial) your cell isn't a Verified Caller ID. |
| Stripe checkout works but status doesn't update | The webhook (B6) isn't set or `STRIPE_WEBHOOK_SECRET` is wrong. |
| Vercel build fails | Usually a missing required env var — check `DATABASE_URL`/`DIRECT_URL`/`NEXTAUTH_SECRET`. |

---

## Security reminder

Any key you pasted in a chat, screenshot, or test file should be **rotated**
before real customers: regenerate it in the provider's dashboard and update it in
Vercel. Never put real keys in the repo — only in `.env` (which is gitignored) or
Vercel's settings.
