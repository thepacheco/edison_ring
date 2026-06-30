# Edison Missed-Call Rescue

_Started 2026-06-30 23:03 UTC_

---

## User

Edison — Claude Design Brief

What this is

Edison is a missed-call rescue tool for local service businesses (HVAC, plumbing, electrical, salons, auto shops). When a business misses a call, Edison auto-texts the caller, has an AI conversation to understand their need, and books them on the calendar. Sold cold-call, B2B, to non-technical small business owners.

Who's using this

Primary user: the business owner. Not a designer, not deeply technical, often checking this from their phone between jobs. Needs everything to feel instantly trustworthy and dead simple — this is the tool standing between them and losing a job, so it needs to look like it works, not like a side project.

Secondary "user": their customer, who only ever sees a text message — no UI for them at all.

Design tone

Trustworthy, fast, no-nonsense. Think Stripe dashboard or Linear — clean, confident, a little technical-feeling (proves it's real software, not a gimmick) but never cluttered. Avoid anything cutesy or overly playful — these are tradespeople and shop owners, not consumer app users. Avoid generic SaaS-template blue-gradient-and-stock-photo look.

Screens to design

1. Landing page


One headline that states the loss directly: "Stop losing jobs to voicemail."
Subhead with the math: a missed call costs you money; Edison catches it.
Single clear CTA: "Start free 14-day trial"
Social proof section (placeholder for testimonials once they exist)
Should read in under 15 seconds — these are people clicking from a text link mid-workday, not browsing leisurely


2. Setup wizard (the single most important screen — this prevents churn)


Step 1: select carrier from dropdown (AT&T, Verizon, T-Mobile, RingCentral, Grasshopper, Google Voice, other)
Step 2: show the exact forwarding code for their carrier, big and copy-pasteable, with a "call this code now" tap-to-call link
Step 3: live test — "Call your business line from another phone now" with a real-time status indicator that flips green the moment Edison receives the test text
Step 4 (if test fails): troubleshooting tree, plus a visible "Talk to a human" fallback button
Design goal: someone should be able to complete this without reading instructions twice


3. Owner dashboard (home screen, what they see most)


Top of page: the "paid for itself" tracker — big, obvious, satisfying when it flips to "paid for itself this month" (this is your retention engine, give it visual weight)
Conversation log: list of recent captured leads, status (new / booked / needs follow-up)
Quick stats: conversations this cycle vs. plan limit (e.g. "247 / 300")
Multi-location view: toggle/dropdown if they have more than one location, with a combined total and per-location breakdown


4. Conversation detail view


Shows the actual text exchange between Edison's AI and the customer, plus booking status
Should make it obvious at a glance: what did the customer need, did they get booked, do they need a callback


5. Settings panel


Business hours
Worker routing rules (round robin / keyword-based / always-to-owner) — needs to be simple enough for a non-technical owner to configure without help
Call-out/backup mode toggle ("I'm out today — route to: ___")
Average ticket price input (feeds the "paid for itself" tracker)
AI tone/message customization (basic — owner can tweak the auto-text wording)


6. Weekly value report (email + in-dashboard view)


"Edison captured 14 leads this week — estimated value $1,200"
Should be screenshot-friendly — this becomes word-of-mouth and testimonial material


7. Billing/upgrade screen


Current plan, usage vs. limit, overage rate if applicable
Multi-location pricing table (volume discount tiers)
Upgrade CTA when nearing plan limits


Constraints


Must work cleanly on mobile browser — no app download, owner will often be checking this on their phone
No login friction beyond standard email/password or magic link
Every screen should answer "is this working and is it making me money" within 2 seconds of looking at it

## Assistant

Great brief — clear and detailed. Before I start building, a few focused questions so I design the right thing rather than guess.

_[tool: questions_v2]_

## User

Questions answered:
- scope: Setup wizard (you flagged it as most important), Owner dashboard + paid-for-itself tracker, Conversation detail view, Landing page, Settings panel, Weekly value report, Billing/upgrade
- fidelity: Polished, near-final mockups of a few key screens
- device: Both, fully responsive
- variations: Yes — 2-3 directions for the hero screens
- vary_what: Visual style (color, type, density), Layout / information hierarchy
- color: Cool slate + electric accent (technical, Stripe-like)
- type: Humanist sans, friendlier but still pro
- tracker_feel: Money counter that ticks up ($ captured this month)
- data_realism: Mix across screens
- logo: Wordmark + simple mark/icon

## Assistant

Answers locked in. Let me set up the plan and start building.

_[tool: update_todos]_

Building the canvas now — design system, logic, and both dashboard directions first.

_[tool: dc_write]_

Direction A is in. Now Direction B — the airy money-first centerpiece.

_[tool: dc_html_str_replace]_

_[tool: show_html]_

Now the setup wizard — the make-or-break screen. I'll show it as a mobile filmstrip of the 4 key states.

_[tool: dc_html_str_replace]_

Need to register the spinner keyframes I referenced. Adding to helmet.

_[tool: dc_html_str_replace]_

Landing page hero next.

_[tool: dc_html_str_replace]_

Conversation detail (mobile) and the weekly value report next.

_[tool: dc_html_str_replace]_

Settings and billing to round out the set.

_[tool: dc_html_str_replace]_

All eight screens are in. Marking complete and verifying.

_[tool: update_todos]_

_[tool: ready_for_verification]_

Turn 1 of Edison is ready on the canvas — all eight screens in the cool-slate + electric-indigo system, Figtree + JetBrains Mono, with the money counters ticking up on load.

What's there:
- **1a / 1b** — the two dashboard directions you asked for: *Console* (dense, sidebar, technical) vs. *Focus* (airy, big green money centerpiece). Same system, different density and hierarchy.
- **1c** — setup wizard as a mobile filmstrip: carrier → forwarding code → live test (listening) → "Edison is live" green flip, with a "Talk to a human" fallback.
- **1d** landing, **1e** conversation detail, **1f** weekly value report (screenshot-friendly), **1g** settings, **1h** billing.

A couple of things to flag and decide:
- The dashboards are the real fork — **tell me 1a or 1b** and I'll build the rest of the set in that direction's density.
- I showed responsive by pairing desktop frames (dashboard/landing/billing) with mobile frames (wizard/conversation). Happy to add a mobile dashboard or a desktop wizard if you want both per screen.
- The wizard's step 4 troubleshooting tree isn't drawn yet — I showed the success path. Want me to add the failure branch next?

Forwarding code shown is a realistic AT&T format placeholder — we'll want to verify exact per-carrier codes before launch.

