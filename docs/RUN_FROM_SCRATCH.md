# Run Edison from scratch (fresh terminal)

This is the copy-paste path for getting Edison running on a brand-new machine —
you have nothing but a terminal and the GitHub repo. It takes ~10 minutes.

At the end you'll have the app running at `http://localhost:3000` with a seeded
demo business you can log into. No Twilio/Stripe/Google account needed for this
first run — those degrade gracefully and you wire them in later
([GO_LIVE.md](GO_LIVE.md)).

---

## 0. Prerequisites (install once)

You need three things. Check what you already have:

```bash
node -v      # need v20 or newer
git --version
psql --version   # Postgres client (optional but handy)
```

- **Node 20+** — install from [nodejs.org](https://nodejs.org) or via `nvm`.
- **Git** — [git-scm.com](https://git-scm.com).
- **A Postgres database.** Two easy options:
  - **Cloud (recommended, zero install):** a free [Neon](https://neon.tech)
    project. Copy its connection string.
  - **Local via Docker:** `docker run --name edison-pg -e POSTGRES_PASSWORD=edison -e POSTGRES_DB=edison -p 5432:5432 -d postgres:16`

---

## 1. Clone the repo

```bash
git clone https://github.com/thepacheco/edison_ring.git
cd edison_ring
```

> Private repo? Clone over HTTPS and paste a GitHub personal access token as the
> password when prompted, or use `gh repo clone thepacheco/edison_ring`.

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create your environment file

```bash
cp .env.example .env.local
```

Open `.env.local` and set **at minimum** these two blocks. Everything else can
stay blank for the first local run.

**Database** — paste your connection string in both:

```bash
# Neon: DATABASE_URL = the POOLED string (host has "-pooler"), DIRECT_URL = the direct one.
# Local Docker: use the same string for both.
DATABASE_URL="postgresql://postgres:edison@localhost:5432/edison?schema=public"
DIRECT_URL="postgresql://postgres:edison@localhost:5432/edison?schema=public"
```

**Claude (for live AI replies)** — optional for the very first boot, required to
actually generate texts:

```bash
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL_ID=claude-haiku-4-5
```

**Local-dev conveniences** — so you're not blocked on a public URL / real admin
password while testing:

```bash
TWILIO_SKIP_SIGNATURE_VALIDATION=true
NEXTAUTH_SECRET=any-long-random-string-here-change-me
ADMIN_PASSWORD=letmein
APP_BASE_URL=http://localhost:3000
```

> `.env.local` is gitignored. **Never commit real keys.** See
> [GO_LIVE.md](GO_LIVE.md) for rotating/recycling keys before production.

---

## 4. Create the database tables + a demo account

```bash
npm run db:migrate     # apply all migrations (creates every table)
npm run db:seed        # insert one demo business + workers + a login
```

The seed prints your **test account**:

```
Login: owner@rivera-comfort.test / password123
```

> On a **production** database, do **not** seed — run `/signup` instead. The seed
> claims a demo Twilio number and inserts fake data.

---

## 5. Run it

```bash
npm run dev
```

Open **http://localhost:3000**. Log in at `/login` with the test account above.

- Dashboard has a **⚡ Run a test lead** button — it simulates a missed-call
  conversation through the real Claude engine (no SMS sent). Great first thing to
  click.
- `/admin/login` → the `ADMIN_PASSWORD` you set → the CEO cockpit + `/admin/model`
  scenario tool.

---

## Common snags

| Symptom | Fix |
|---|---|
| `Can't reach database server` | Postgres isn't running / wrong `DATABASE_URL`. Start Docker container or check the Neon string. |
| `P3009` / failed migration | You pointed at a DB with partial state. Use a fresh database (or a fresh Neon branch). |
| Login says invalid | You skipped `npm run db:seed`, or you're on a different DB than you seeded. |
| Port 3000 in use | `PORT=3001 npm run dev`. |
| AI replies are blank/error | `ANTHROPIC_API_KEY` missing or wrong. The rest of the app still works. |

---

## What to read next

- **[TESTING.md](TESTING.md)** — a proper end-to-end test run, including on your
  own cell phone.
- **[GO_LIVE.md](GO_LIVE.md)** — swap sandbox keys for live ones, monitor usage,
  and roll out.
- **[DEPLOY.md](../DEPLOY.md)** — deploy to Vercel + Neon + an IONOS domain.
