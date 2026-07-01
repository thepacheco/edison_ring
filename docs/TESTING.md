# Testing Edison

How to set up a **test database**, use the **test account**, and run Edison
end-to-end — including a real **tester run on your own cell phone** and a
**website review checklist** before you show it to anyone.

There are two "environments" you'll hear about here:

- **Sandbox / test** — throwaway database + Twilio/Stripe **test** credentials.
  Break things freely. This is where all testing happens.
- **Live / production** — real database, real (recycled) keys, real customers.
  Covered in [GO_LIVE.md](GO_LIVE.md).

Keep them completely separate: a separate database and a separate `.env`.

---

## 1. Set up a test database

Pick one. Both are free.

### Option A — Neon branch (recommended)

Neon lets you branch your database like git. Your live data stays untouched.

1. In your Neon project, **Branches → New branch**, name it `test`.
2. Copy the branch's **pooled** and **direct** connection strings.
3. Put them in `.env.local` as `DATABASE_URL` and `DIRECT_URL`.

When you want a clean slate, delete the `test` branch and make a new one.

### Option B — Local Postgres via Docker

```bash
docker run --name edison-test-pg \
  -e POSTGRES_PASSWORD=edison -e POSTGRES_DB=edison \
  -p 5432:5432 -d postgres:16
```

Then in `.env.local` (same string for both):

```bash
DATABASE_URL="postgresql://postgres:edison@localhost:5432/edison?schema=public"
DIRECT_URL="postgresql://postgres:edison@localhost:5432/edison?schema=public"
```

Reset anytime with `docker rm -f edison-test-pg` and re-run the command.

### Create the tables + demo data

```bash
npm run db:migrate     # create every table
npm run db:seed        # demo business + workers + a login
```

---

## 2. The test account

The seed creates a ready-to-use owner login:

```
URL:      http://localhost:3000/login   (or your deployed test URL)
Email:    owner@rivera-comfort.test
Password: password123
```

Admin/CEO cockpit:

```
URL:      /admin/login
Password: whatever you set as ADMIN_PASSWORD in .env.local
```

Need a second user to test roles/invites? Log in as the owner →
**Settings → Team → Add user**.

---

## 3. Test the AI without any phone (fastest)

You don't need Twilio to see the conversation engine work:

1. Log in → **Dashboard**.
2. Click **⚡ Run a test lead**.

This creates a fake missed-call conversation and runs it through the **real
Claude engine** (no SMS is sent, no Twilio needed). You'll see the transcript,
the detected intent, and whether it booked or escalated to a human. Run it a few
times — urgent samples (e.g. "water heater leaking") correctly escalate.

Then click into **Conversations** to read the transcript, and **Reports** to see
it show up in the analytics.

---

## 4. Tester run on your cell phone

This is the real thing: a live missed call → auto-text → SMS conversation. You
need Twilio and a **publicly reachable URL** so Twilio's webhooks can hit your
app.

### 4a. Give your local app a public URL

Twilio can't reach `localhost`. Two ways:

- **Deploy the test build to Vercel** (see [DEPLOY.md](../DEPLOY.md)) and point
  Twilio at that URL. Cleanest.
- **Tunnel your laptop** with [ngrok](https://ngrok.com): `ngrok http 3000`,
  then use the `https://….ngrok.io` URL as `APP_BASE_URL`.

Set `APP_BASE_URL` to that public URL and `TWILIO_SKIP_SIGNATURE_VALIDATION=false`.

### 4b. Get a Twilio test number

1. In [Twilio Console](https://console.twilio.com), buy a cheap **local** number
   (SMS + Voice enabled). Trial credit covers this.
2. Put your `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and that number as
   `TWILIO_PHONE_NUMBER` in your env.
3. On the number's config page, set the webhooks:
   - **Voice → A call comes in:** `POST  https://YOUR_URL/api/webhooks/twilio/voice`
   - **Messaging → A message comes in:** `POST  https://YOUR_URL/api/webhooks/twilio/sms`
4. Make sure `Business.twilioNumber` in the app matches this number. (The seed
   sets a demo number — update it, or sign up a fresh business and complete
   `/setup`.)

> **Twilio trial accounts** can only text **verified** numbers. Verify your own
> cell in Console → Phone Numbers → Verified Caller IDs, or upgrade the account.

### 4c. The actual test

1. **From your cell phone, text the Twilio number** something a customer would say:
   *"Hi, do you do AC repair? My unit stopped working."*
2. Within a couple seconds you should get Edison's auto-reply back on your phone.
3. Reply naturally ("today if possible", give a name, etc.). Watch it triage,
   try to book, or escalate.
4. On the **dashboard/Conversations** page, the same thread appears in real time
   (read-only — to reply as the human you'd text from the owner's phone).

**Testing the missed-call path specifically:** in real life the business forwards
its line to the Twilio number on no-answer/busy, and the *Voice* webhook fires
the opening auto-text. To simulate, **call** the Twilio number and let it ring
through — the voice webhook creates the conversation and sends the greeting. See
[CALL_FORWARDING.md](CALL_FORWARDING.md) for how owners wire this up.

### Tester checklist

- [ ] Auto-text arrives on my phone within a few seconds
- [ ] Replies are on-brand and answer the question
- [ ] It asks for the info it needs (service, timing, name)
- [ ] A clear booking or a clean human hand-off happens (no dead ends)
- [ ] The thread shows up on the dashboard and in Reports
- [ ] Usage counter on the dashboard ticks up by one per conversation

---

## 5. Review the website (before you demo/sell it)

Click through every page and confirm it looks right on **desktop and phone**
(resize the browser or open it on your cell).

**Marketing (logged out)**
- [ ] `/` home — hero, CTAs work, nothing overlaps on mobile
- [ ] `/services`, `/pricing`, `/about`, `/contact` — contact form submits
- [ ] `/for/hvac`, `/for/plumbing`, `/for/electrical` (+ others) — industry pages load
- [ ] A made-up URL (e.g. `/nope`) shows the styled **404**, not a crash
- [ ] **Light/dark toggle** flips cleanly with no flash on reload

**App (logged in)**
- [ ] `/dashboard` — ROI/"paid for itself" tracker, usage, recent leads
- [ ] `/conversations` + a transcript open correctly
- [ ] `/reports` — histograms, topics, worker leaderboard render
- [ ] `/locations` — map (or the graceful fallback if no Mapbox token),
      per-location breakdown, add/remove a location
- [ ] `/setup` — carrier dropdown → forwarding code → live-test indicator
- [ ] `/billing` — plan/pricing shows
- [ ] `/settings` (+ Team, Account) — change name, add/remove a user, worker routing
- [ ] Log out works

**Admin**
- [ ] `/admin` — MRR, subscribers, trials, near-limit, failed payments
- [ ] `/admin/model` — sliders move the P&L, break-even and 12-month projection live

**Auth edges**
- [ ] Wrong password shows a friendly error (not a stack trace)
- [ ] `/forgot` → reset email flow works (needs `RESEND_API_KEY`; otherwise the
      token is logged for dev)

---

## 6. Tear down / reset

- **Neon:** delete the `test` branch, make a new one.
- **Docker:** `docker rm -f edison-test-pg`.
- Re-run `npm run db:migrate && npm run db:seed` to start fresh.

When the test run looks good, move on to **[GO_LIVE.md](GO_LIVE.md)** to swap in
real keys and publish.
