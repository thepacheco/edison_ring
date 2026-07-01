# How Edison works (the whole picture)

This is the plain-English explainer: what Edison does, **how the texting actually
works**, who answers the customer (AI vs. a human), how a new business is
onboarded, how scheduling works, and how you take it from a **test database to
live**. There's a code map at the bottom so you can see what every part does.

If you only read one section, read **"The texting flow"** — that's the part
that's confusing, and everything else builds on it.

---

## 1. What Edison is

When a local service business (HVAC, plumbing, salon, auto shop…) misses a
call, Edison instantly **texts the caller back**, has a short AI conversation to
figure out what they need, tries to **book the job**, and shows the owner the
money it recovered. No app for the customer — it's all SMS.

**What we offer, in one list:**
- Missed-call → automatic text-back within seconds
- AI conversation (Claude) that answers questions and collects job details
- Booking into Google Calendar (or "collect the time, human confirms" if no
  calendar)
- Owner dashboard: money recovered, leads, booked jobs
- Reports: when calls come in, top topics, per-worker booked jobs & revenue
- Team accounts with roles, worker routing (round-robin / keyword / owner)
- Multi-location: a number per location + a fleet map
- Billing (Stripe): plans, trial, overage, hard cap
- Admin/CEO cockpit + a private financial scenario model

---

## 2. The texting flow (the important part)

There are **three** phone numbers in play. This is the thing that trips people
up.

| Number | Whose is it | What it does |
|---|---|---|
| **Customer's cell** | a real person calling you | they call you, then text with Edison |
| **Your business line** | your normal number | the number customers dial |
| **The Edison number** | a number you **rent from Twilio** (~$1–2/mo) | the "robot" number that sends & receives all the texts |

The Edison number is **not** your phone and **not** the customer's — it's a
dedicated number owned by the app. Here's the whole loop:

```
1. Customer calls YOUR BUSINESS LINE.
2. You don't answer (on a job / after hours / busy).
3. Your carrier FORWARDS the missed call → THE EDISON (TWILIO) NUMBER.
      (that's the one-time forwarding code you dial during setup)
4. Twilio tells the app "a call from [customer] just came in."
5. The app TEXTS THE CUSTOMER, from the Edison number:
      "Sorry we missed you — how can we help?"
6. Customer texts back → goes to the Edison number → Twilio → the app.
7. The app runs the message through Claude → texts a reply back
      from the Edison number.
8. Every message (both directions) is SAVED IN THE DATABASE.
      → that saved transcript is what "Conversations" shows you.
```

So to answer the recurring question directly: **the app texts the customer's
cell phone, using the Edison/Twilio number as the sender.** You never text
through the website. The app knows what happened because **every message
physically passes through Twilio → the app** before it reaches anyone, and gets
written to the database.

**Where the Edison number comes from:** you buy it inside Twilio (2 minutes),
and we tell Twilio "whenever this number gets a call or a text, ping the app at
this URL." Those are the two webhooks:
- Voice (missed call): `/api/webhooks/twilio/voice`
- SMS (text): `/api/webhooks/twilio/sms`

> **Important carrier rule:** a toll-free Edison number (`1-8xx`) must pass
> **Toll-Free Verification** before it can send texts; a local 10-digit number
> must be registered for **A2P 10DLC**. Until that's done, carriers block your
> texts. Voice/forwarding works immediately; texting does not.

---

## 3. Who answers the customer — AI vs. human

**The AI answers first, automatically.** Claude:
- reads the whole thread each turn,
- answers questions, collects the job + preferred time,
- books it if it can,
- and, if it can't resolve it in **2 back-and-forths** (or the customer sounds
  urgent, or explicitly needs a person), it says *"let me have someone from the
  team call you back"* and marks the lead **Needs follow-up**.

**How a human takes over today:** the owner/worker sees the lead on the
dashboard (status **Needs follow-up**) and **texts or calls the customer from
their own phone.** The in-app conversation screen is **read-only** — it's a
viewer of the transcript, not a place to reply.

**What this means for you:** Edison is an *AI receptionist that hands off to a
human*, not a fully automated closer and not a human-only inbox. The AI does the
first-response and easy bookings; people handle the judgment calls.

> **Known gaps here (candidates to build):**
> - No **in-app reply / "take over" button** — you reply from your own phone.
> - The assigned worker **isn't texted** when a lead is handed to them; they
>   find it on the dashboard. (Easy to add: text the worker "New lead: call
>   [name] at [number].")
> - Reports show booked jobs per worker, but not an **"AI-handled vs.
>   human-handled"** split.

---

## 4. Onboarding — what a new business does

1. **Sign up** (`/signup`) → creates the business + the owner login, and a
   primary location.
2. **Billing** (`/billing`) → start the free trial (card via Stripe).
3. **Setup wizard** (`/setup`) → pick your phone carrier → it shows the exact
   **call-forwarding code** with your Edison number filled in → you dial it once.
4. **Live test** → the first forwarded missed call flips the setup indicator
   green. Prefer not to wire the phone yet? Click **⚡ Run a test lead** on the
   dashboard to simulate the whole AI conversation with no phone.
5. **Settings** → set hours, average ticket, auto-text wording, and add workers.

That's the whole onboarding. The only thing with a lead time is the carrier
texting registration (Toll-Free Verification / A2P 10DLC) — start it early.

See [`CALL_FORWARDING.md`](CALL_FORWARDING.md) for the per-carrier codes.

---

## 5. Scheduling — Google, or no calendar at all

- **Google Calendar connected:** Edison pulls your real open slots into the
  text conversation and creates the event when the customer confirms.
- **No calendar connected:** Edison still asks for the customer's preferred time
  and marks the lead so **a human confirms and books it** in whatever they use —
  a personal calendar, a paper book, anything. Nothing breaks.

So a business that doesn't use Google (or Outlook) **still works** — Edison
captures the appointment request; the person schedules it. Native **Outlook**
booking isn't built yet (it's on the roadmap); today it's "Google, or manual."

---

## 6. Team, routing & usage

- **Routing modes** (Settings): *always-to-owner*, *round-robin* (rotates by
  order), or *keyword* (e.g. "drain" → Theo). If the chosen worker marked
  themselves out, it falls back to their backup, then the owner.
- **Roles:** owners can change settings, billing, workers, and locations; staff
  can view. (Owner-only actions are enforced server-side.)
- **Usage per person:** the Reports page shows each worker's **booked jobs and
  revenue**. (A split of how many the AI closed vs. a human closed isn't there
  yet.)

---

## 7. Billing & usage limits

Stripe handles subscriptions (plans, 14-day trial, card required). Each plan
includes a monthly conversation count; going over bills a small per-conversation
overage, and a **hard cap (1,000/mo)** blocks runaway auto-billing and flags the
account. The admin cockpit (`/admin`) shows MRR, trials, churn, near-limit
accounts, and real estimated COGS/margin.

---

## 8. Test database → Live (this is the part you're worried about)

**The key idea: the code never changes between test and live. Only the
environment variables change.** "Going live" = point the same app at your real
database + real keys and deploy it. Here's the mental model:

```
          SAME CODE (this repo)
                 │
      ┌──────────┴───────────┐
      ▼                      ▼
  TEST setup             LIVE setup
  - test Neon DB         - live Neon DB
  - Twilio test / trial  - verified Twilio number
  - Stripe TEST keys     - Stripe LIVE keys
  - seeded demo data     - real signups (no seed)
  - runs on localhost    - runs on Vercel + your domain
```

**How you actually do it:**

1. **Test everything** on a throwaway database first. Best practice: in Neon,
   make a **branch** called `test` and point your local `.env` at it. Seed it
   (`npm run db:seed`), click around, run test leads, break things freely.
2. When it works, **deploy to Vercel** connected to your GitHub repo. In Vercel
   you set the **live** environment variables (live DB URL, real keys). The code
   that deploys is identical to what you tested.
3. **Bring the live database up to the same schema** by running the migrations
   against it once: `npm run db:migrate` (with the live DB URL). This creates all
   the tables. **Do not seed the live DB** — real businesses sign up through
   `/signup` instead of using the demo data.
4. **Wire the live integrations** to your Vercel URL (Twilio webhooks, Stripe
   webhook, Google redirect). Same steps as test, just the live URL.
5. **Re-deploying later is automatic:** push to your `main` branch → Vercel
   rebuilds and redeploys. Your data in the live database is untouched by a code
   deploy (only a *migration* changes the database, and migrations are additive
   and versioned).

So "test then go live" is not a risky one-way switch — it's the same app reading
a different `.env`. You can even keep the `test` Neon branch around forever to
try changes before they hit production. Full step-by-step:
[`GO_LIVE.md`](GO_LIVE.md).

> **Why `.env` and not `.env.local`:** the Prisma commands (`db:migrate`,
> `db:seed`) only read `.env`. Put your database URL there. On Vercel you set the
> vars in the dashboard, not in a file.

---

## 9. Code map — what each part does

```
src/
├─ app/
│  ├─ page.tsx                    Marketing home
│  ├─ about, services, pricing,   Marketing pages
│  │   contact, for/[industry]
│  ├─ terms, privacy              Legal
│  ├─ signup, login, forgot,      Auth screens
│  │   reset
│  ├─ dashboard/                  Owner home: money recovered, leads, stats
│  ├─ conversations/              Lead list + read-only SMS transcript
│  ├─ reports/                    Analytics: timing, topics, per-worker
│  ├─ locations/                  Multi-location fleet map + per-location numbers
│  ├─ setup/                      Call-forwarding wizard + live test
│  ├─ billing/                    Stripe checkout + billing portal
│  ├─ settings/                   Hours, routing, workers, team, account
│  ├─ admin/                      CEO cockpit + /admin/model scenario tool
│  ├─ actions.ts                  ALL server actions (signup, settings, etc.)
│  └─ api/
│     ├─ webhooks/twilio/voice    Missed call → start conversation + auto-text
│     ├─ webhooks/twilio/sms      Inbound text → run AI → reply  (+ STOP/HELP)
│     ├─ stripe/webhook           Subscription status sync
│     ├─ google/connect,callback  Calendar OAuth
│     └─ cron/*                   Weekly report + overage billing
│
├─ lib/                          The "brains" (no UI):
│  ├─ conversation.ts             The Claude engine: prompt, reply, book, escalate
│  ├─ twilio.ts                   Send SMS, provision/release numbers, verify webhooks
│  ├─ google.ts                   Find open slots + create calendar events
│  ├─ routing.ts                  Which worker gets a lead
│  ├─ optout.ts                   STOP/START/HELP compliance
│  ├─ auth.ts                     Login sessions, roles (owner/staff), admin gate
│  ├─ pricing.ts                  Plans, overage, COGS constants
│  ├─ usage.ts                    Monthly conversation counting
│  ├─ dashboard.ts, analytics.ts, Data for the dashboard / reports / locations
│  │   locations.ts, admin.ts     (each scoped to the logged-in business)
│  ├─ carriers.ts                 Per-carrier forwarding codes
│  └─ email.ts                    Resend (reports, password reset)
│
└─ components/                   Reusable UI (nav, cards, map, theme toggle…)

prisma/
├─ schema.prisma                 The database shape (Business, User, Conversation,
│                                 Message, Worker, Location, OptOut, UsageRecord…)
├─ migrations/                   Versioned SQL that builds the live DB
└─ seed.ts                       Demo business + login (TEST databases only)
```

**The flow through the code, one more time:** a missed call hits
`api/webhooks/twilio/voice` → creates a `Conversation` + sends the first text via
`lib/twilio`. The customer's reply hits `api/webhooks/twilio/sms` →
`lib/conversation` runs Claude, maybe books via `lib/google`, assigns a worker
via `lib/routing`, saves everything, and sends the reply. The dashboard/reports
read that saved data back out through `lib/dashboard` and `lib/analytics`.

---

## 10. Honest roadmap (not built yet)

- **In-app reply / take-over** so the owner can jump into a text thread from the
  dashboard instead of using their own phone.
- **Text the assigned worker** when a lead is handed off.
- **Outlook / other calendars**, and an explicit "manual scheduling" mode.
- **Richer dashboard** — real charts/graphs (trends over time), more of a
  Stripe-style analytics feel.
- **AI-handled vs. human-handled** breakdown in Reports.

These are all straightforward additions on top of the current architecture —
none require rethinking how it works.
