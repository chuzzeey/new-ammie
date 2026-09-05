#!/usr/bin/env node
/**
 * Lock down admin signups — Supabase → Authentication → Sign In / Providers →
 * Email → "Allow new users to sign up" → OFF.
 *
 * Uses the Supabase Management API — no dashboard fiddling needed.
 * With signups disabled, the ONLY way to get an admin account is to have it
 * provisioned out-of-band (scripts/create-admin.mjs or the Supabase dashboard).
 * Anyone attempting to register — through the app OR directly against the
 * Supabase API — is rejected by Supabase itself with "Signups not allowed".
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<your-token> node scripts/disable-signups.mjs        # turn signups OFF (default)
 *   SUPABASE_ACCESS_TOKEN=<your-token> node scripts/disable-signups.mjs --on   # turn signups back ON
 */

const PROJECT_REF = "lfoksiwnzkqeqsmkkxrw" // from your Supabase project URL
const API_BASE = "https://api.supabase.com/v1"

const reopenSignups = process.argv.includes("--on")
const disableSignup = !reopenSignups

const token = process.env.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error("❌ Missing SUPABASE_ACCESS_TOKEN")
  console.error("")
  console.error("To get a token:")
  console.error("  1. Open https://supabase.com/dashboard/account/tokens")
  console.error("  2. Click 'Generate new token', name it anything, click 'Generate'")
  console.error("  3. COPY the token — it is only shown ONCE")
  console.error("")
  console.error("Then run:")
  console.error(
    `  SUPABASE_ACCESS_TOKEN=your-token-here node scripts/disable-signups.mjs${reopenSignups ? " --on" : ""}`
  )
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

function signupState(config) {
  // `disable_signup === true` means the dashboard toggle "Allow new users to
  // sign up" is OFF.
  return config.disable_signup ? "NO (signups disabled)" : "YES (open signup)"
}

async function main() {
  console.log(`Using project: ${PROJECT_REF}`)

  // 1. Show the current state (before).
  console.log("Fetching current auth config…")
  const before = await request(`/projects/${PROJECT_REF}/config/auth`)
  console.log("")
  console.log("BEFORE:")
  console.log("  Allow new users to sign up: " + signupState(before))
  console.log("")

  // 2. Flip the signup toggle.
  console.log(disableSignup ? "Disabling new signups…" : "Re-enabling new signups…")
  await request(`/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    body: JSON.stringify({ disable_signup: disableSignup }),
  })

  // 3. Read back and verify.
  const after = await request(`/projects/${PROJECT_REF}/config/auth`)
  const ok = after.disable_signup === disableSignup

  console.log("")
  console.log("AFTER:")
  console.log(
    "  Allow new users to sign up: " + signupState(after) + (ok ? "  ✅" : "  ⚠️ unexpected")
  )
  console.log("")

  if (!ok) {
    console.error("⚠️ The config did not read back as expected — open")
    console.error("   Supabase Dashboard → Authentication → Sign In / Providers → Email")
    console.error("   and check the 'Allow new users to sign up' toggle manually.")
    process.exit(1)
  }

  if (disableSignup) {
    console.log("✅ Done! Public signups are now CLOSED.")
    console.log("   - /admin/signup no longer exists — /admin/login is the only door.")
    console.log("   - Registration attempts via the API fail with 'Signups not allowed'.")
    console.log("   - Existing admins can still log in and reset their password as usual.")
    console.log("")
    console.log("Next — create the owner's account (if you haven't already):")
    console.log(
      "  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> node scripts/create-admin.mjs --email her@email.com"
    )
    console.log("  …then she sets her own password via /admin/login → 'Forgot your password?'")
  } else {
    console.log("✅ Done! Public signups are OPEN again.")
    console.log("   Remember: /admin/signup has been removed from the app, so registration")
    console.log("   would only be possible via direct API calls. Re-add the page if you")
    console.log("   intend to keep signups open.")
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
