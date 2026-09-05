/**
 * On-demand ISR revalidation API route.
 *
 * Call this endpoint after any product CRUD operation to instantly
 * revalidate the product detail page and the shop listing page.
 *
 * Usage:
 *   POST /api/revalidate
 *   Body: { path: "/product/abc-123" }
 *
 * This ensures that when an admin uploads a new video or updates
 * product info, the statically-generated page is refreshed without
 * requiring a full rebuild.
 */

import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (admin only)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No need to set cookies on API route
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { path } = body as { path?: string }

    if (!path) {
      return NextResponse.json({ error: "Missing 'path' in request body" }, { status: 400 })
    }

    // Revalidate the specific path
    revalidatePath(path)

    // Also revalidate the shop page since product listings change
    revalidatePath("/shop")

    return NextResponse.json({
      revalidated: true,
      path,
      now: Date.now(),
    })
  } catch (error: any) {
    console.error("Revalidation error:", error)
    return NextResponse.json(
      { error: error.message || "Revalidation failed" },
      { status: 500 },
    )
  }
}
