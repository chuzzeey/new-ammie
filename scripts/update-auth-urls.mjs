#!/usr/bin/env node
/**
 * Point Supabase's email links at the LIVE site (https://ammien.shop) instead of
 * localhost, and allow-list both the production and local dev domains.
 *
 * What it changes (Supabase → Authentication → URL Configuration):
 *   - Site URL        → https://ammien.shop
 *   - Redirect URLs   → https://ammien.shop/**
 *                       https://www.ammien.shop/**
 *                       http://localhost:3000/**   (kept for local dev)
 *
 * Uses the Supabase Management API — no dashboard fiddling needed.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<your-token> node scripts/update-auth-urls.mjs
 */

const PROJECT_REF = "lfoksiwnzkqeqsmkkxrw" // from your Supabase project URL
const API_BASE = "https://api.supabase.com/v1"

const SITE_URL = "https://ammien.shop"
const REDIRECT_URLS = [
  "https://ammien.shop/**",
  "https://www.ammien.shop/**",
  "http://localhost:3000/**",
]

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
  console.error("  SUPABASE_ACCESS_TOKEN=your-token-here node scripts/update-auth-urls.mjs")
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

async function main() {
  console.log(`Using project: ${PROJECT_REF}`)

  // 1. Show the current values (before).
  console.log("Fetching current auth config…")
  const before = await request(`/projects/${PROJECT_REF}/config/auth`)
  console.log("")
  console.log("BEFORE:")
  console.log("  Site URL:      " + (before.site_url || "(unset)"))
  console.log("  Redirect URLs: " + (JSON.stringify(before.uri_allow_list) || "(unset)"))
  console.log("")

  // 2. Patch Site URL + Redirect URL allow list.
  //    NOTE: the Management API expects uri_allow_list as a COMMA-SEPARATED STRING.
  console.log("Updating Site URL and Redirect URLs…")
  await request(`/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    body: JSON.stringify({
      site_url: SITE_URL,
      uri_allow_list: REDIRECT_URLS.join(","),
    }),
  })

  // 3. Read back and verify (uri_allow_list may come back as a comma-separated
  //    string or an array depending on the API — normalise it).
  const after = await request(`/projects/${PROJECT_REF}/config/auth`)
  const afterList = Array.isArray(after.uri_allow_list)
    ? after.uri_allow_list
    : String(after.uri_allow_list || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
  const siteOk = after.site_url === SITE_URL
  const listOk = REDIRECT_URLS.every((u) => afterList.includes(u))

  console.log("")
  console.log("AFTER:")
  console.log("  Site URL:      " + after.site_url + (siteOk ? "  ✅" : "  ⚠️ unexpected"))
  console.log("  Redirect URLs: " + JSON.stringify(afterList) + (listOk ? "  ✅" : "  ⚠️ unexpected"))
  console.log("")

  if (siteOk && listOk) {
    console.log("✅ Done! Email confirmation / password-reset links now return users to")
    console.log(`   ${SITE_URL} — NOT localhost — when they sign up or reset from the live site.`)
    console.log("   http://localhost:3000/** stays allow-listed so local dev keeps working.")
    console.log("")
    console.log("Note: the app itself always sends the domain it runs on (window.location.origin),")
    console.log("so no code change was needed — this was purely the Supabase-side allow list.")
  } else {
    console.error("⚠️ The config did not read back as expected — open")
    console.error("   Supabase Dashboard → Authentication → URL Configuration and check manually.")
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
