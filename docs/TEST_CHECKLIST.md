# Edison — full test checklist (beginning to end)

Work top to bottom. **Phases 0–8 you can do entirely on your laptop** (no phone,
no Twilio, no Stripe needed). **Phase 9** is the real-phone test (needs the app
online). **Phase 10** is go-live.

Check each box. If anything doesn't match the "Expect," note it and we'll fix it.

---

## Phase 0 — Get it running (~10 min)

- [ ] In the project folder, your `.env` has the DATABASE_URL + DIRECT_URL +
      ANTHROPIC_API_KEY (the block I gave you). Uses **`.env`**, not `.env.local`.
- [ ] `npm install` — finishes without red errors.
- [ ] `npm run db:migrate` — Expect: "All migrations have been successfully applied."
      (If it times out once, run again — Neon waking up.)
- [ ] `npx prisma db seed` — Expect: "Login: owner@rivera-comfort.test / password123"
- [ ] `npm run dev` — Expect: it prints a localhost URL.
- [ ] Open **http://localhost:3000** — the marketing home page loads.

> Testing on your **real** database? Skip `db seed` and use `/signup` instead
> (Phase 1) so you don't insert demo data.

---

## Phase 1 — Account & onboarding

- [ ] Go to **/signup**, create a business (any email/password, 8+ chars).
      Expect: lands on the Billing page with a welcome banner.
- [ ] (If email is set up) a **welcome email** arrives.
- [ ] Click **Log out** (top right), then **/login** back in. Expect: dashboard.
- [ ] Try **/forgot** with your email. Expect: "if an account exists, a link is on
      its way" (the reset link is emailed, or printed in the terminal if email
      isn't configured).
- [ ] On the dashboard, Expect a **"Let's get you set up" checklist** at the top
      (because setup isn't done yet).

---

## Phase 2 — The AI conversation (no phone needed) ⭐ the important one

- [ ] On the dashboard, click **⚡ Run a test lead**.
      Expect: it drops you into a conversation transcript.
- [ ] Read it — Expect: Edison's greeting, a fake customer message, and a
      **natural, on-brand AI reply** (not robotic).
- [ ] Expect: a status (New / Booked / Needs follow-up) and a one-line summary.
- [ ] Run it **3–4 more times**. Expect: urgent ones (e.g. "water heater
      leaking") get marked **Needs follow-up** (handed to a human); simple ones
      may book.

---

## Phase 3 — Dashboard & analytics

- [ ] Dashboard shows **money recovered**, stat cards, and **charts** (money over
      8 weeks, leads vs booked, a funnel).
- [ ] **Upcoming appointments** card is present.
- [ ] Go to **/admin**, log in with your **ADMIN_PASSWORD**.
      Expect: the CEO cockpit — MRR, subscribers, growth charts, COGS, margin.
      (This is YOUR business-wide view of all clients.)

---

## Phase 4 — CRM (conversations)

- [ ] Open **Conversations**. Expect: a searchable list with a lead count.
- [ ] Type a name/word in **Search** → Search. Expect: filtered results.
- [ ] Click the status chips (New / Booked / Needs follow-up / Closed) and the
      contacted chips. Expect: the list filters.
- [ ] Open a lead → click **Mark contacted**. Expect: button flips to
      "✓ Contacted — undo" and a green "contacted" badge shows in the list.
- [ ] Click **Mark closed**, then **Reopen**. Expect: status changes.
- [ ] On the lead, the **Call** and **Text from my phone** buttons open your
      phone's dialer/messages (test on a phone, or they're just links on desktop).

---

## Phase 5 — Calendar & scheduling

- [ ] Open **Calendar**. Switch between **Day / 3-Day / Week / Month**.
      Expect: any booked jobs show at their times; today is highlighted.
- [ ] Use the **filter** chips and **prev / Today / next**. Expect: it navigates.
- [ ] Go to **Settings → Business** and confirm your **hours** show (Edison offers
      appointment times from these).

---

## Phase 6 — Settings

- [ ] **Settings** has tabs: **Business / Messaging / Team & routing**.
- [ ] **Business** tab: change **Average ticket** → Save. Expect: "✓ Saved" and
      the dashboard's math updates.
- [ ] **Messaging** tab: click a **greeting Template** → it fills the box.
      Change the tone (friendly/professional/brief) → the templates change. Save.
- [ ] **Team & routing** tab: pick a **routing mode**; add a **worker** and click
      a **suggested keyword** chip → it adds to the keywords box. Save.
- [ ] Top **Team** tab: add a second user, change their role, remove them.
- [ ] Top **Account** tab: change your name/email; change your password, then log
      in with the new one.

---

## Phase 7 — Billing (test mode — no real money)

- [ ] **/billing** shows your plan, usage bar, and **multi-location pricing**
      tiers (Single / Multi / Fleet).
- [ ] (If Stripe test keys are set) start a plan → on Stripe's page pay with
      **4242 4242 4242 4242**, any future expiry, any CVC. Expect: back on billing,
      status shows trialing/active.
- [ ] Expand **Cancel service**. Expect: the step-by-step (cancel → turn off
      forwarding → number released).

---

## Phase 8 — Locations & mobile

- [ ] **/locations** shows your **primary** location (your main number).
- [ ] Add a location (name + area code). Expect: it appears in the list.
- [ ] **Open the site on your phone's browser.** Expect: everything fits, the top
      nav scrolls, buttons are tappable.
- [ ] Toggle **dark mode** (moon icon, top right). Expect: clean switch.

✅ **If Phases 0–8 all pass, the product works.** Now put it online for the real
phone test.

---

## Phase 9 — The real phone test (needs the app online)

You need a public URL so Twilio can reach the app. Easiest: **deploy to Vercel**
(see [`TEST_TO_LIVE.md`](TEST_TO_LIVE.md) Part B), or tunnel with `ngrok http 3000`.

- [ ] In Twilio, your number's **Voice** webhook = `https://YOUR-URL/api/webhooks/twilio/voice`
      and **Messaging** = `https://YOUR-URL/api/webhooks/twilio/sms`.
- [ ] (Toll-free number) **Toll-Free Verification** is approved — otherwise texts
      are blocked. (Trial account? Your cell must be a **Verified Caller ID**.)
- [ ] **Text your Edison number** from your cell: "Do you do AC repair?"
      Expect: an AI reply within a few seconds.
- [ ] Reply asking to book a time. Expect: Edison offers slots and confirms;
      the appointment shows on **Calendar**.
- [ ] Text **STOP**. Expect: an unsubscribe confirmation; further texts stop.
- [ ] Text **START**. Expect: re-subscribe confirmation.
- [ ] **Missed-call test:** forward your business line to the Edison number
      (Setup wizard shows the exact code for your phone type), then call it from
      another phone and let it ring out. Expect: the auto-text arrives.
- [ ] The whole thread appears under **Conversations** in real time.

---

## Phase 10 — Go live

- [ ] **Rotate every key** (Neon, Anthropic, Twilio, Stripe) — the ones shared in
      chat/testing are burned. Put the new ones in **Vercel**.
- [ ] Live env vars set in Vercel (Production); `TWILIO_SKIP_SIGNATURE_VALIDATION=false`.
- [ ] `npm run db:migrate` against the **live** database (don't seed).
- [ ] Stripe **live** webhook added; `STRIPE_WEBHOOK_SECRET` set.
- [ ] Real `/signup`, forward a real phone, and repeat Phase 9 on the live URL.
- [ ] `/admin` bookmarked for monitoring (usage, near-limit, failed payments).

🎉 Done = a real missed call produced a real text and it's on your dashboard.
