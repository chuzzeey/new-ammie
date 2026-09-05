import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh the session
  const { data: { user } } = await supabase.auth.getUser()

  // Public auth pages — reachable without a session.
  // /admin/update-password is public so the password-reset link can land the
  // user straight on it (the session exchange happens in the callback first).
  // NOTE: /admin/signup was removed — signups are disabled; old links to it
  // are redirected to the login page below.
  const publicAuthPaths = [
    '/admin/login',
    '/admin/forgot-password',
    '/admin/update-password',
  ]
  const isPublicAuthPath = publicAuthPaths.includes(request.nextUrl.pathname)

  // Signup is disabled — accounts are provisioned out-of-band
  // (scripts/create-admin.mjs or the Supabase dashboard). Old /admin/signup
  // links redirect to the login page instead of 404-ing.
  if (request.nextUrl.pathname.startsWith('/admin/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Protect all other /admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !isPublicAuthPath) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from the public auth pages
  if (isPublicAuthPath && user) {
    // ...except /admin/update-password — a logged-in user here came through a
    // reset link and needs to stay to set their new password.
    if (request.nextUrl.pathname !== '/admin/update-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}