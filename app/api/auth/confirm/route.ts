import { createClientServer } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Auth callback route.
 *
 * Supabase emails a confirmation/recovery LINK. When the user clicks it, the
 * browser is redirected here with a `code` query param (PKCE flow). We exchange
 * that code for a session, which sets the session cookies, then send the user on
 * to the `next` destination.
 *
 * - Signup confirmation → ?next=/admin
 * - Password recovery   → ?next=/admin/update-password
 */
export async function GET(request: NextRequest) {
  // Behind a load balancer / reverse proxy (e.g. production hosting),
  // request.url's origin can be an internal address — prefer the original
  // host the user actually visited (same pattern as the official
  // Supabase Next.js guide).
  const { searchParams, origin } = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin

  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/admin"

  if (code) {
    const supabase = await createClientServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Success: the exchange above just set the session cookies, so the user
      // lands on `next` (e.g. /admin) already logged in.
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // Code missing or exchange failed — back to login with a friendly error.
  return NextResponse.redirect(`${baseUrl}/admin/login?error=confirm`)
}