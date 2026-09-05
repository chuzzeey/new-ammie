#!/usr/bin/env node
/**
 * Applies the branded "Reset your password" email template (and subject) to the
 * Supabase project — the email sent by /admin/login → "Forgot your password?".
 *
 * Uses the Supabase Management API — no dashboard fiddling needed.
 *
 * What it changes (Supabase → Authentication → Emails → Templates):
 *   - "Reset Password" template body → branded Ammie N HTML
 *   - "Reset Password" subject       → "Reset your password — Ammie N"
 *
 * The HTML is also saved to docs/emails/reset-password.html as a record and as
 * a copy-paste fallback for the dashboard editor.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<your-token> node scripts/update-email-templates.mjs
 *   node scripts/update-email-templates.mjs --export-only   (just write the HTML file)
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { RECOVERY_SUBJECT, recoveryTemplateHtml } from "./email-templates/recovery-template.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

const PROJECT_REF = "lfoksiwnzkqeqsmkkxrw" // from your Supabase project URL
const API_BASE = "https://api.supabase.com/v1"
const EXPORT_PATH = join(ROOT, "docs", "emails", "reset-password.html")

const exportOnly = process.argv.includes("--export-only")
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!token && !exportOnly) {
  console.error("❌ Missing SUPABASE_ACCESS_TOKEN")
  console.error("")
  console.error("To get a token:")
  console.error("  1. Open https://supabase.com/dashboard/account/tokens")
  console.error("  2. Click 'Generate new token', name it anything, click 'Generate'")
  console.error("  3. COPY the token — it is only shown ONCE")
  console.error("")
  console.error("Then run:")
  console.error("  SUPABASE_ACCESS_TOKEN=your-token-here node scripts/update-email-templates.mjs")
  console.error("")
  console.error("(Or run with --export-only to just save the HTML without any API calls.)")
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

function describeExpiry(seconds) {
  const s = Number(seconds) > 0 ? Number(seconds) : 86400 // GoTrue default: 24h
  if (s % 3600 === 0) {
    const hours = s / 3600
    return hours === 1 ? "1 hour" : hours + " hours"
  }
  if (s % 60 === 0) return s / 60 + " minutes"
  return s + " seconds"
}

function saveExport(html) {
  mkdirSync(dirname(EXPORT_PATH), { recursive: true })
  writeFileSync(EXPORT_PATH, html)
  console.log("📄 Template HTML saved to docs/emails/reset-password.html")
}

async function main() {
  console.log(`Using project: ${PROJECT_REF}`)

  // Read current config to inject the real link-expiry value into the copy.
  const config = exportOnly ? null : await request(`/projects/${PROJECT_REF}/config/auth`)
  const expiresLabel = describeExpiry(config?.mailer_otp_exp)
  const html = recoveryTemplateHtml(expiresLabel)

  console.log("")
  console.log(`Recovery link expiry (from project config): ${expiresLabel}`)
  console.log("")
  saveExport(html)

  if (exportOnly) {
    console.log("")
    console.log("✅ Export only — no API calls made.")
    return
  }

  // 1. Show the current state (before).
  console.log("")
  console.log("BEFORE:")
  console.log("  Reset subject: " + (config?.mailer_subjects_recovery || "(default)"))
  const beforeBody = config?.mailer_templates_recovery_content_path
  console.log(
    "  Reset body:    " +
      (typeof beforeBody === "string" && beforeBody.trim().length > 0
        ? beforeBody.length + " chars (custom)"
        : "(Supabase default)")
  )
  console.log("")

  // 2. Apply the branded subject + body.
  console.log("Applying branded reset-password email template…")
  await request(`/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    body: JSON.stringify({
      mailer_subjects_recovery: RECOVERY_SUBJECT,
      mailer_templates_recovery_content_path: html,
    }),
  })

  // 3. Read back and verify.
  const after = await request(`/projects/${PROJECT_REF}/config/auth`)
  const subjectOk = after?.mailer_subjects_recovery === RECOVERY_SUBJECT
  const afterBody =
    typeof after?.mailer_templates_recovery_content_path === "string"
      ? after.mailer_templates_recovery_content_path
      : ""
  const bodyOk = afterBody.includes("{{ .ConfirmationURL }}") && afterBody.length > 1000

  console.log("")
  console.log("AFTER:")
  console.log(
    "  Reset subject: " +
      (after?.mailer_subjects_recovery || "(default)") +
      (subjectOk ? "  ✅" : "  ⚠️ unexpected")
  )
  console.log(
    "  Reset body:    " +
      (afterBody ? afterBody.length + " chars" : "(empty)") +
      (bodyOk ? "  ✅" : "  ⚠️ not verified")
  )
  console.log("")

  if (subjectOk && bodyOk) {
    console.log("✅ Done! Password-reset emails now use the branded Ammie N template.")
    console.log("   Test it: /admin/login → 'Forgot your password?' → check the inbox.")
  } else {
    console.log("⚠️ Could not verify the template via the API (it may not have applied).")
    console.log("   Fallback — paste it in manually (30 seconds):")
    console.log("   1. Supabase Dashboard → Authentication → Emails → Templates")
    console.log("   2. Open 'Reset Password'")
    console.log("   3. Subject:  " + RECOVERY_SUBJECT)
    console.log("   4. Body:     paste the contents of docs/emails/reset-password.html")
    console.log("   5. Save")
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
