#!/usr/bin/env node
/**
 * Configure custom SMTP for the Supabase project (Management API — no dashboard).
 *
 * WHY: Supabase's built-in email sender (free tier) allows only a handful of
 * emails per hour — testing "Forgot your password?" a few times in a row trips
 * "Email rate limit exceeded". A custom SMTP provider removes that limit and is
 * far less likely to land in spam.
 *
 * Provider presets (free tiers):
 *   gmail     smtp.gmail.com:587        needs a Google App Password (2FA on)
 *   brevo     smtp-relay.brevo.com:587  300 emails/day free
 *   resend    smtp.resend.com:465       3,000/month free (verify your domain)
 *   sendgrid  smtp.sendgrid.net:587     100 emails/day free (login is "apikey")
 *   mailgun   smtp.mailgun.org:587
 *   custom    pass --host/--port yourself
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<token> node scripts/setup-smtp.mjs \
 *     --provider brevo --user <smtp-login> --pass <smtp-key> \
 *     --from no-reply@ammien.shop [--name "Ammie N"]
 *
 *   node scripts/setup-smtp.mjs --status    show current SMTP config (never the password)
 *   node scripts/setup-smtp.mjs --disable   revert to Supabase's built-in sender
 *
 * Rate limit: with the BUILT-IN sender, emails are hard-capped at 2/hour
 * (project-wide, across all email endpoints) — Supabase does not allow raising
 * this, even on paid plans. Only custom SMTP unlocks it: pass
 *   --email-rate-limit <N>    (emails per hour, e.g. 30)
 * either together with the SMTP credentials, or standalone later (no credentials
 * needed to update just the limit). Keep it modest — reset emails can be abused
 * for mail-bombing; 10–30/hour is plenty.
 */

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

const PROJECT_REF = "lfoksiwnzkqeqsmkkxrw" // from your Supabase project URL
const API_BASE = "https://api.supabase.com/v1"

const PRESETS = {
  gmail: { host: "smtp.gmail.com", port: 587 },
  brevo: { host: "smtp-relay.brevo.com", port: 587 },
  resend: { host: "smtp.resend.com", port: 465, defaultUser: "resend" },
  sendgrid: { host: "smtp.sendgrid.net", port: 587, defaultUser: "apikey" },
  mailgun: { host: "smtp.mailgun.org", port: 587 },
}

const args = process.argv.slice(2)
function argValue(name) {
  const index = args.indexOf(name)
  return index !== -1 ? args[index + 1] : undefined
}
function hasFlag(name) {
  return args.includes(name)
}

function readEnvLocal() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8")
    const entries = {}
    for (const line of raw.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      entries[trimmed.slice(0, eq).trim()] = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
    }
    return entries
  } catch {
    return {}
  }
}

// Token from the environment (inline export) or .env.local — whichever is present.
const token = process.env.SUPABASE_ACCESS_TOKEN || readEnvLocal().SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error("❌ Missing SUPABASE_ACCESS_TOKEN")
  console.error("")
  console.error("Either export it inline:")
  console.error("  SUPABASE_ACCESS_TOKEN=your-token node scripts/setup-smtp.mjs …")
  console.error("")
  console.error("Or add it once to .env.local so every script can use it:")
  console.error("  SUPABASE_ACCESS_TOKEN=your-token")
  console.error("")
  console.error("To get a token:")
  console.error("  1. Open https://supabase.com/dashboard/account/tokens")
  console.error("  2. Click 'Generate new token', name it anything, click 'Generate'")
  console.error("  3. COPY the token — it is only shown ONCE")
  process.exit(1)
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = body?.message || body?.error || JSON.stringify(body)
    console.error(`❌ Request failed (HTTP ${res.status}): ${message}`)
    console.error("")
    if (res.status === 401 || res.status === 403) {
      console.error("Your token looks invalid, expired, or revoked. Generate a fresh one at")
      console.error("https://supabase.com/dashboard/account/tokens and try again.")
    }
    process.exit(1)
  }
  return body
}

function printSmtp(config) {
  const set = (v) => (v ? v : "(not set)")
  console.log("  Host:        " + set(config?.smtp_host))
  console.log("  Port:        " + (config?.smtp_port || "(not set)"))
  console.log("  User:        " + set(config?.smtp_user))
  console.log("  Password:    " + (config?.smtp_pass ? "(set — never returned by the API)" : "(not set)"))
  console.log("  From:        " + set(config?.smtp_admin_email))
  console.log("  Sender name: " + set(config?.smtp_sender_name))
  console.log(
    "  Email rate:  " + (config?.rate_limit_email_sent ?? "(default)") + " emails/hour"
  )
}

async function main() {
  console.log(`Using project: ${PROJECT_REF}`)
  console.log("")

  // --status: show current SMTP settings and exit.
  if (hasFlag("--status")) {
    const config = await request(`/projects/${PROJECT_REF}/config/auth`)
    console.log("Current SMTP configuration:")
    printSmtp(config)
    const usingCustom = Boolean(config?.smtp_host && config?.smtp_user && config?.smtp_pass)
    console.log("")
    console.log(
      usingCustom
        ? "✅ Custom SMTP is ACTIVE — the built-in email rate limit no longer applies."
        : "⚠️  Custom SMTP is NOT configured — sends are hard-capped at 2/hour and cannot be raised on the built-in sender."
    )
    return
  }

  // --disable: revert to the built-in sender.
  if (hasFlag("--disable")) {
    console.log("Reverting to Supabase's built-in email sender…")
    await request(`/projects/${PROJECT_REF}/config/auth`, {
      method: "PATCH",
      body: JSON.stringify({ smtp_host: "", smtp_user: "", smtp_pass: "" }),
    })
    const after = await request(`/projects/${PROJECT_REF}/config/auth`)
    console.log("")
    console.log("Current SMTP configuration:")
    printSmtp(after)
    console.log("")
    console.log("✅ Done — built-in sender restored (mind its hourly rate limit).")
    return
  }

  // Configure SMTP.
  const provider = (argValue("--provider") || "").toLowerCase()
  const preset = PRESETS[provider]
  const host = argValue("--host") || preset?.host
  const portRaw = argValue("--port") || String(preset?.port || "")
  const port = /^\d+$/.test(portRaw) ? Number(portRaw) : portRaw
  const smtpUser = argValue("--user") || preset?.defaultUser
  const smtpPass = argValue("--pass")
  const fromEmail = (argValue("--from") || "").trim()
  const senderName = argValue("--name") || "Ammie N"

  // Optional: emails-per-hour limit. Only effective once custom SMTP is active —
  // the built-in sender is hard-capped at 2/hour by Supabase and cannot be raised.
  const rateLimitRaw = argValue("--email-rate-limit")
  const rateLimit = rateLimitRaw ? Number(rateLimitRaw) : undefined
  const rateLimitOnly = Boolean(rateLimitRaw) && !smtpPass // update just the limit, no credentials needed

  if (rateLimitRaw && !Number.isInteger(rateLimit)) {
    console.error("❌ --email-rate-limit must be a whole number of emails per hour, e.g. --email-rate-limit 30")
    process.exit(1)
  }
  if (rateLimit && (rateLimit < 1 || rateLimit > 3600)) {
    console.error("❌ --email-rate-limit must be between 1 and 3600 emails per hour.")
    process.exit(1)
  }

  if (!rateLimitOnly && (!host || !port)) {
    console.error("❌ Unknown provider: " + (provider || "(none given)"))
    console.error("")
    console.error("Choose one of: " + Object.keys(PRESETS).join(", ") + " — or pass --host/--port (custom).")
    process.exit(1)
  }
  if (!rateLimitOnly && (!smtpUser || !smtpPass)) {
    console.error("❌ Missing SMTP credentials — pass --user and --pass.")
    console.error("")
    console.error("Example (Brevo, 300 emails/day free):")
    console.error(
      "  SUPABASE_ACCESS_TOKEN=<token> node scripts/setup-smtp.mjs \\\n" +
        "    --provider brevo --user <brevo-login-email> --pass <smtp-key> \\\n" +
        '    --from no-reply@ammien.shop --name "Ammie N"'
    )
    process.exit(1)
  }
  if (!rateLimitOnly && (!fromEmail || !fromEmail.includes("@"))) {
    console.error("❌ Missing sender address — pass --from no-reply@ammien.shop (or similar).")
    process.exit(1)
  }

  console.log("BEFORE:")
  const before = await request(`/projects/${PROJECT_REF}/config/auth`)
  printSmtp(before)
  console.log("")

  const patch = rateLimitOnly
    ? { rate_limit_email_sent: rateLimit }
    : {
        smtp_host: host,
        smtp_port: port,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_admin_email: fromEmail,
        smtp_sender_name: senderName,
        ...(rateLimit ? { rate_limit_email_sent: rateLimit } : {}),
      }

  console.log(
    rateLimitOnly
      ? `Applying email rate limit (${rateLimit}/hour)…`
      : `Applying SMTP (${provider || "custom"}, ${host}:${port})…`
  )
  await request(`/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })

  const after = await request(`/projects/${PROJECT_REF}/config/auth`)
  const ok = rateLimitOnly
    ? Number(after?.rate_limit_email_sent) === rateLimit
    : String(after?.smtp_host) === String(host) &&
      String(after?.smtp_admin_email) === fromEmail &&
      String(after?.smtp_sender_name) === senderName

  console.log("")
  console.log("AFTER:")
  printSmtp(after)
  console.log("")

  if (ok) {
    console.log(
      rateLimitOnly
        ? `✅ Done! Email rate limit set to ${rateLimit}/hour (effective once custom SMTP is active).`
        : "✅ Done! Custom SMTP is active — the 'Email rate limit exceeded' wall is gone."
    )
    if (rateLimit && !rateLimitOnly) {
      console.log(`   Email rate limit: ${rateLimit} emails/hour.`)
    }
    console.log("   (The password is write-only: Supabase stored it but never returns it.)")
    console.log("")
    console.log("Test it: /admin/login → 'Forgot your password?' → check the inbox.")
    console.log("")
    console.log("Deliverability tips:")
    console.log("  - Verify ammien.shop in your SMTP provider's dashboard (SPF/DKIM DNS records)")
    console.log("    so reset emails land in the inbox, not spam.")
    console.log("  - The --from address should be on that verified domain.")
  } else {
    console.log("⚠️ The config did not read back as expected — check")
    console.log("   Supabase Dashboard → Authentication → Settings → SMTP manually.")
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
