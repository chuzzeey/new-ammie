# Admin Authentication — Setup Guide (Supabase Auth)

The admin panel (`/admin`) uses **Supabase Auth** with:
- **Login** at `/admin/login` — email + password.
- **Forgot password** at `/admin/forgot-password` — email → reset **link** → set a new password at `/admin/update-password`.
- Session handling via `@supabase/ssr` (cookies) with route protection in `proxy.ts`.

**Signups are disabled — single-admin lockdown.** There is no `/admin/signup` page and
the "Allow new users to sign up" toggle is OFF in Supabase. There is exactly **one**
admin account, provisioned out-of-band (see §6). Visitors cannot create accounts —
not through the app, and not by calling the Supabase API directly.

---

## 1. What we need from your Supabase project

Already configured in `.env.local` (there is nothing extra required to run):

| Variable | Purpose | In your project |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | `https://lfoksiwnzkqeqsmkkxrw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Settings → API → "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | *(optional)* Server-only admin operations | Settings → API → "service_role" — **never** expose client-side |

The login/forgot flows run client-side with the anon key. Account provisioning uses
the **service role key server-side only** (`scripts/create-admin.mjs`) — never expose
it in the app bundle.

---

## 2. One-time Supabase Dashboard settings (5 minutes)

Open your Supabase project → **Authentication**:

### 2.1 Providers
- **Authentication → Providers → Email** → make sure it is **Enabled**.

### 2.2 Auth settings
- **Authentication → Sign In / Providers → Email**:
  - ❌ **Allow new users to sign up — OFF** (single-admin lockdown). Applied via
    `scripts/disable-signups.mjs` (Management API) — run it with `--on` only if
    you ever need to temporarily reopen public registration.
- **Authentication → Sign In / Providers → Email** (under "Email options"):
  - ✅ **Confirm email** — recommend ON. (When ON, users confirm via the emailed link
    before their account is active — this works on the free tier.)
- **Authentication → Settings → Auth Service → Site URL / Redirect URLs**:
  - ✅ **Already configured for you** via `scripts/update-auth-urls.mjs` (Management API):
    - **Site URL** = `https://ammien.shop` (production is the default landing target)
    - **Redirect URLs** = `https://ammien.shop/**`, `https://www.ammien.shop/**`,
      `http://localhost:3000/**` (dev keeps working)
  - In practice the app pins the email return URL with `getSiteOrigin()`
    (`lib/utils/site-url.ts`), which resolves in this order:
    1. `NEXT_PUBLIC_SITE_URL` env var (set it in your hosting dashboard if the
       domain ever changes)
    2. `https://ammien.shop` for **any production build** — hard safety net, so
       email links can never point at localhost by accident
    3. `window.location.origin` in local dev — dev emails return to
       `http://localhost:3000`

    So: sign up / reset on `https://ammien.shop` → the email link always returns
    to `https://ammien.shop`. Sign up / reset while testing on localhost → the
    link returns to localhost (and only works while the dev server is running).

### 2.3 Redirect URLs (important)

The confirmation and password-reset links route through the app's callback:
`/api/auth/confirm`. That path is covered by the wildcard entries above. If you ever
deploy to a NEW domain, add `https://<new-domain>/**` to
**Authentication → URL Configuration → Redirect URLs** (or re-run
`scripts/update-auth-urls.mjs` with the updated list) — otherwise Supabase will
show an error instead of returning the user to the app.

### 2.4 SMTP (recommended — fixes "Email rate limit exceeded")
Supabase's built-in email sender is rate-limited (only a handful of emails per hour on
the free tier), so testing "Forgot your password?" a few times in a row fails with
**"Email rate limit exceeded"**. Configure custom SMTP to remove the limit:

```bash
# Example: Brevo (300 emails/day free) — get the SMTP key from brevo.com → SMTP & API
SUPABASE_ACCESS_TOKEN=<token> node scripts/setup-smtp.mjs \
  --provider brevo --user <brevo-login-email> --pass <smtp-key> \
  --from no-reply@ammien.shop --name "Ammie N"

# Check current state / revert:
node scripts/setup-smtp.mjs --status     # (with token) show current SMTP config
node scripts/setup-smtp.mjs --disable    # revert to the built-in sender
```

Provider presets built in: `gmail` (needs an App Password), `brevo`, `resend`,
`sendgrid`, `mailgun`, or `custom` via `--host/--port`.

> **Rate limit note:** with the built-in sender, emails are hard-capped at
> **2 emails/hour** (project-wide, across all email endpoints) and this **cannot
> be raised** — not even on paid plans. Only custom SMTP unlocks it. Pass
> `--email-rate-limit <emails-per-hour>` (e.g. `30`) when configuring SMTP, or run
> the script with just that flag later. With Brevo's free 300/day, a single
> admin's occasional "Forgot password?" emails are effectively limitless.
> Separately, the same email can only request one reset per 60 seconds — that
> per-user cooldown is adjustable under Authentication → Rate Limits.
>
> Chosen for this project: **300 emails/hour (= 5/minute)** —
> `node scripts/setup-smtp.mjs --email-rate-limit 300`

- Verify `ammien.shop` in the provider's dashboard (SPF/DKIM DNS records) so emails
  land in the inbox, not spam — the `--from` address should be on that domain.
- The branded reset-password email template is applied separately via
  `scripts/update-email-templates.mjs` and works with any SMTP provider.

---

## 3. Optional — admin_profiles table

A migration is included at `lib/supabase/migrations/20260409_admin_profiles.sql`.
It creates a queryable `admin_profiles` table (`id`, `full_name`, `email`),
auto-synced from `auth.users` user metadata on signup, with RLS so each admin can
only read/update their own row. The auth flow works fine without it.

**Option A — SQL Editor (simplest):** copy the file's contents into
Supabase → SQL Editor → **Run**.

**Option B — Supabase CLI** (from the project root):
```bash
npx supabase login            # sign in to your Supabase account
npx supabase link --project-ref lfoksiwnzkqeqsmkkxrw
cp lib/supabase/migrations/20260409_admin_profiles.sql supabase/migrations/
npx supabase db push
```

---

## 4. Supabase CLI commands (for things the dashboard can't do)

The CLI doesn't install anything into this project (used via `npx`):

| Command | What it does |
|---|---|
| `npx supabase init` | Creates a `supabase/` folder for local config/migrations |
| `npx supabase login` | Links your machine to your Supabase account |
| `npx supabase link --project-ref <ref>` | Links this project to your hosted project (`lfoksiwnzkqeqsmkkxrw`) |
| `npx supabase db pull` | Pulls the current remote schema |
| `npx supabase db push` | Applies migration files to the linked project |
| `npx supabase migration new <name>` | Scaffolds a new migration file |
| `npx supabase projects list` | Lists your projects + refs |
| `npx supabase start` / `stop` | Run a full local Supabase stack |

Management API scripts (same family as `scripts/update-auth-urls.mjs`):

| Command | What it does |
|---|---|
| `SUPABASE_ACCESS_TOKEN=<token> node scripts/disable-signups.mjs` | Closes public signup (add `--on` to reopen) |
| `SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/create-admin.mjs --email <email>` | Creates the owner's admin account (auto-confirmed, temp password) |
| `SUPABASE_ACCESS_TOKEN=<token> node scripts/update-email-templates.mjs` | Applies the branded "Reset your password" email template + subject (HTML also saved to `docs/emails/reset-password.html`; `--export-only` skips the API call) |
| `SUPABASE_ACCESS_TOKEN=<token> node scripts/setup-smtp.mjs --provider <p> --user <u> --pass <k> --from <email>` | Configures custom SMTP (removes the built-in sender's hourly rate limit). `--status` / `--disable` also available |

---

## 5. Verification checklist

- [ ] `Email` provider enabled, `Confirm email` on.
- [x] Site URL = `https://ammien.shop` and Redirect URLs allow-listed
      (`https://ammien.shop/**`, `https://www.ammien.shop/**`, `http://localhost:3000/**`)
      — applied via `scripts/update-auth-urls.mjs`.
- [ ] ❌ `Allow new users to sign up` disabled (`scripts/disable-signups.mjs`).
- [ ] Owner account created (`scripts/create-admin.mjs --email <owner-email>`)
      and she has set her own password via the reset email.
- [ ] Optional SMTP configured (makes reset emails fast and reliable).
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Optional: `admin_profiles` migration applied.

Then run `npm run dev` and test:
1. `/admin/signup` → redirects to `/admin/login` (the page no longer exists).
2. `/admin/login` → sign in with the owner email + password.
3. `/admin/forgot-password` → email → reset **link** → set a new password → login page shows the reset banner.
4. Registration attempts (e.g. via the API) fail — Supabase rejects new signups.

---

## 6. Single-admin lockdown (implemented)

The store has **exactly one admin**. Signups are closed at the Supabase level, so the
login page is the only door — and "Forgot your password?" is the only self-service
flow (it only works for emails that already have an account).

**1. Disable public signups** (Management API — no dashboard fiddling):
```bash
SUPABASE_ACCESS_TOKEN=<your-token> node scripts/disable-signups.mjs        # close signups
SUPABASE_ACCESS_TOKEN=<your-token> node scripts/disable-signups.mjs --on   # reopen (if ever needed)
```

**2. Remove the signup UI** — done in code: `/admin/signup` no longer exists and
redirects to `/admin/login`; the login page no longer advertises account creation.

**3. Create the owner's account** (service role key — server-side only):
```bash
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> node scripts/create-admin.mjs --email her@email.com --name "Her Name"
```
Creates a confirmed account with a random temp password. The Supabase dashboard
(Authentication → Users → Add user) does the same thing manually.

**4. She sets her own password**:
`/admin/login` → **Forgot your password?** → emailed reset link → new password at
`/admin/update-password`.

Need a second admin someday? Repeat step 3 with the new email — no code changes
required. To clean up old/test users: Dashboard → Authentication → Users → delete
(cascades into `admins` / `admin_profiles`).