/**
 * The origin that auth email links (confirmation / password-reset) should
 * return users to.
 *
 * Priority order:
 * 1. `NEXT_PUBLIC_SITE_URL` env var — set this when deploying if the domain
 *    ever changes (e.g. in Vercel/hosting env settings).
 * 2. `https://ammien.shop` for any production build — safety net so email
 *    links can NEVER point at localhost by accident, even if env vars are
 *    forgotten or the site is opened from an unexpected origin.
 * 3. `window.location.origin` for local dev — so dev emails return to the
 *    running dev server (http://localhost:3000), which stays allow-listed in
 *    Supabase for testing.
 */
export function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.NODE_ENV === "production") {
    return "https://ammien.shop"
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "http://localhost:3000"
}