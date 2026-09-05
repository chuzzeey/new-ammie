#!/usr/bin/env node
/**
 * Create the store owner's admin account (there is no public signup).
 *
 * Uses the Supabase Admin API with the service role key. That key is
 * SERVER-SIDE ONLY — run this locally / in CI, never put it in the app bundle.
 *
 * The account is created confirmed with a random temporary password. The owner
 * then sets a password of her own choosing:
 *   /admin/login → "Forgot your password?" → emailed reset link → new password
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> node scripts/create-admin.mjs --email her@email.com [--name "Ammie N"] [--password 'TempPass123!']
 *
 *   · --email     (required) the owner's email address
 *   · --name      (optional) full name stored in user metadata (feeds admin_profiles)
 *   · --password  (optional) temp password; a random one is generated if omitted
 */

import { readFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// --- Resolve Supabase URL from the environment or .env.local (no deps) ------
function readEnvLocal() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8")
    const entries = {}
    for (const line of raw.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
      entries[key] = value
    }
    return entries
  } catch {
    return {}
  }
}

const envLocal = readEnvLocal()
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  envLocal.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/$/, "")
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY || ""

// --- Parse CLI args ----------------------------------------------------------
const args = process.argv.slice(2)
function argValue(name) {
  const index = args.indexOf(name)
  return index !== -1 ? args[index + 1] : undefined
}

const email = (argValue("--email") || "").trim().toLowerCase()
const fullName = (argValue("--name") || "").trim()
const explicitPassword = argValue("--password")
const tempPassword = explicitPassword || `Ammie-${randomBytes(12).toString("base64url")}`

if (!SUPABASE_URL.startsWith("http")) {
  console.error("❌ Could not resolve the Supabase project URL.")
  console.error("   Add NEXT_PUBLIC_SUPABASE_URL to .env.local or export it before running.")
  process.exit(1)
}

if (!SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY")
  console.error("")
  console.error("To get it:")
  console.error("  1. Open your Supabase project dashboard")
  console.error("  2. Go to Settings → API → Project API keys")
  console.error("  3. Copy the 'service_role' secret (keep it secret — server-side only!)")
  console.error("")
  console.error("Then run:")
  console.error(
    "  SUPABASE_SERVICE_ROLE_KEY=your-key-here node scripts/create-admin.mjs --email her@email.com"
  )
  process.exit(1)
}

if (!email || !email.includes("@") || !email.includes(".")) {
  console.error("❌ Please pass the owner's email address:")
  console.error("  node scripts/create-admin.mjs --email her@email.com")
  process.exit(1)
}

async function main() {
  console.log(`Supabase project: ${SUPABASE_URL}`)
  console.log(`Creating admin account for: ${email}`)
  console.log("")

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: tempPassword,
      // Skip the confirmation email — the account is immediately usable.
      email_confirm: true,
      ...(fullName ? { user_metadata: { full_name: fullName } } : {}),
    }),
  })

  const body = await res.json().catch(() => null)

  if (res.status === 422) {
    console.error("❌ Supabase rejected this: " + (body?.msg || body?.message || "user already registered?"))
    console.error("")
    console.error("If an account with this email already exists, no new account was created.")
    console.error("She can simply sign in at /admin/login, or reset her password via")
    console.error("/admin/login → 'Forgot your password?'.")
    console.error("(Old/test users can be deleted in Dashboard → Authentication → Users.)")
    process.exit(1)
  }

  if (!res.ok) {
    console.error(`❌ Request failed (HTTP ${res.status}): ${body?.msg || body?.message || "unknown error"}`)
    process.exit(1)
  }

  console.log("✅ Admin account created and email-confirmed.")
  console.log("")
  console.log(`   User ID:   ${body?.id || "(unknown)"}`)
  console.log(`   Email:     ${email}`)
  if (!explicitPassword) {
    console.log(`   Temp pass: ${tempPassword}`)
    console.log("   (Give this to her once over a trusted channel — or skip it entirely")
    console.log("    and let her set her own password via the reset email below.)")
  }
  console.log("")
  console.log("Next steps — she chooses her own password:")
  console.log("  1. Open /admin/login")
  console.log('  2. Click "Forgot your password?" and enter this email')
  console.log("  3. Follow the emailed link and set a password of her choice")
  console.log("  4. Sign in — done. She is the one and only admin.")
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
