# Onboarding a new business: call forwarding setup

This is the **one thing** a new business owner has to do for Edison to work:
forward their calls to their Edison number **when they miss them**. Once that's
set, every unanswered or busy call turns into an automatic rescue text.

It takes about 2 minutes. The in-app **Setup wizard (`/setup`)** walks the owner
through it with their exact code and a tap-to-call button — this doc is the
plain-English explanation behind that wizard, plus a fallback if a carrier isn't
listed.

---

## How it works (say this to the owner)

> "You keep your normal business number. We give you a second 'Edison' number.
> You set your phone so that **when you don't pick up** — you're on a job, it's
> after hours, the line's busy — the call **rolls over to Edison** instead of
> voicemail. Edison instantly texts that caller back, has a quick conversation,
> and books them. You never lose the lead."

Key point: this is **conditional** forwarding (only on no-answer/busy), *not* "forward
all calls." Their phone still rings normally. Edison only steps in on a miss.

---

## The 4 steps (what the wizard does)

1. **Sign up** at `/signup` → creates the business + owner login.
2. **Get the Edison number** — shown on the setup screen. This is the number
   calls forward *to*.
3. **Pick the carrier** from the dropdown → the wizard shows the **exact
   forwarding code** with the Edison number already filled in, plus a
   tap-to-call button.
4. **Dial the code once** from the business phone. The wizard runs a **live
   test** that flips green the first time Edison receives a forwarded call.

---

## Forwarding codes by carrier

The owner dials these **from the business phone**. `EDISON` = their Edison number
(digits only). The app fills this in automatically; the table is for reference /
support calls.

| Carrier | Turn ON (forward on no-answer/busy) | Turn OFF |
|---|---|---|
| **AT&T** | `*004*EDISON#` then call | `##004#` |
| **Verizon** | `*71` then `EDISON` (e.g. `*71EDISON`) | `*73` |
| **T-Mobile** | `**004*EDISON#` then call | `##004#` |
| **RingCentral** | In app: **Call Handling → Forward to** the Edison number | Remove the rule |
| **Grasshopper** | In app: **Settings → Call Forwarding →** Edison number | Remove the number |
| **Google Voice** | **Voice Settings → Calls →** forward to the Edison number | Unlink the number |
| **Landline (copper)** | `*92EDISON` (forward on no-answer) | `*93` |
| **Home/office VoIP** (Xfinity, Spectrum, Ooma, Vonage, Fios) | In the provider's app/site: **Call Forwarding → No Answer →** Edison number | Remove the rule |
| **Other / not sure** | Contact support — we'll find the exact code | — |

> **Not a cell phone?** Many shops run a **landline** or a **cable/VoIP home
> phone**, and forwarding works differently:
> - **Landline:** `*92` + the Edison number activates "forward on no answer";
>   `*93` cancels. These codes vary by local phone company — if `*92` doesn't
>   take, call them and ask to enable **"Call Forwarding No Answer"** to the
>   Edison number.
> - **VoIP / cable phone:** there's no dial code; set it in the provider's app or
>   website under Call Forwarding → No Answer (or Busy).

> ⚠️ Carrier codes change and vary by plan/region. **Verify the exact code with
> the carrier** before onboarding at scale. The definitive list the app uses
> lives in [`src/lib/carriers.ts`](../src/lib/carriers.ts) — update it there and
> the wizard updates everywhere.

### Codes explained

- `*004*…#` (AT&T/T-Mobile) sets **all** conditional forwards at once — no
  answer, busy, and unreachable — in a single command. This is the one you want.
- `*71` (Verizon) forwards when busy **or** unanswered while leaving normal
  ringing intact.
- Codes starting with `##` **cancel** forwarding.

---

## Confirming it works

- The `/setup` **live test** goes green automatically on the first forwarded call
  Edison receives. (Behind the scenes: the voice webhook fires and flips
  `setupCompleted`.)
- Manual check: from a **different** phone, call the business number and **let it
  ring out / don't answer**. Within seconds, that phone should receive Edison's
  auto-text. 
- Prefer a dry run first? The dashboard's **⚡ Run a test lead** simulates the
  whole conversation with no phone at all.

---

## "Things always change" — keeping it current

Numbers, staff, hours, and carriers change. Make re-checking forwarding part of
onboarding **and** a periodic review:

- **Changed carriers or got a new business phone?** Re-dial the forwarding code —
  a new SIM/carrier wipes it. Re-run `/setup` to re-verify.
- **New Edison number or added a location?** Provision the number on `/locations`;
  each location forwards its own line to its own Edison number. Update the
  forwarding target on that location's phone.
- **Hours / after-hours behavior changed?** Update **Settings → hours** so the
  auto-text wording and timing match. Forwarding itself is 24/7 conditional; the
  message adapts to the business's hours.
- **Staff changed?** Update **Settings → Workers & routing** so escalations reach
  the right person.

A good habit: verify forwarding is still active (place one unanswered test call)
whenever a business swaps phones, carriers, or numbers — that's the only thing
that silently breaks the whole flow.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No auto-text after a missed call | Forwarding not active / wrong code | Re-dial the ON code; confirm carrier + exact code |
| Calls skip straight to Edison (phone never rings) | They set *unconditional* forwarding | Cancel with the OFF code, use the conditional (`*004*…#` / `*71`) code |
| Text arrives but is blank/errors | `ANTHROPIC_API_KEY` missing/invalid | Fix the key (host env) |
| Test never goes green | Webhook URL not reachable / number mismatch | Confirm Twilio voice webhook points at the live app and `Business.twilioNumber` matches |
| Trial Twilio number won't text a caller | Twilio **trial** only texts verified numbers | Upgrade the Twilio account (see [GO_LIVE.md](GO_LIVE.md)) |

For anything a business owner can't self-serve, the **"Other / not sure"** carrier
option routes them to a human — that's the right answer for unusual PBX/VoIP
setups.
